from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from datetime import datetime, timedelta
import random
import string

from database import execute_query, execute_insert, execute_update
from models import BookingCreate, BookingResponse
from routes.auth import get_current_user

router = APIRouter()

@router.post("/cleanup")
async def cleanup_expired_bookings(current_user: dict = Depends(get_current_user)):
    """Cleanup expired bookings"""
    now = datetime.now().isoformat()
    
    # Update expired bookings to completed
    result = execute_update(
        """UPDATE bookings 
           SET status = 'completed'
           WHERE status IN ('pending', 'active')
           AND end_time <= ?""",
        (now,)
    )

    # Update related sessions to locked
    execute_update(
        """UPDATE sessions 
           SET status = 'locked', locked_at = ?
           WHERE booking_id IN (
               SELECT id FROM bookings 
               WHERE status = 'completed' AND end_time <= ?
           )""",
        (now, now)
    )

    return {
        "message": "Cleanup completed successfully",
        "updated_bookings": result
    }

@router.get("/", response_model=List[BookingResponse])
async def get_bookings(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all bookings with optional date filter"""
    query = """
        SELECT 
            b.*,
            c.name as computer_name,
            c.location,
            c.description,
            u.username,
            u.fullname
        FROM bookings b
        JOIN computers c ON b.computer_id = c.id
        JOIN users u ON b.user_id = u.id
    """
    params = []
    
    if start_date and end_date:
        query += " WHERE b.start_time >= ? AND b.end_time <= ?"
        params.extend([start_date, end_date])
    
    query += " ORDER BY b.start_time"
    
    bookings = execute_query(query, tuple(params))
    
    return [
        BookingResponse(
            id=booking["id"],
            user_id=booking["user_id"],
            computer_id=booking["computer_id"],
            start_time=booking["start_time"],
            end_time=booking["end_time"],
            status=booking["status"],
            computer_name=booking["computer_name"],
            computer_location=booking["location"],
            computer_description=booking["description"],
            username=booking["username"],
            fullname=booking["fullname"],
            created_at=booking["created_at"]
        )
        for booking in bookings
    ]

@router.get("/my-bookings", response_model=List[BookingResponse])
async def get_my_bookings(current_user: dict = Depends(get_current_user)):
    """Get current user's bookings"""
    bookings = execute_query("""
        SELECT 
            b.*,
            c.name as computer_name,
            c.location,
            c.description
        FROM bookings b
        JOIN computers c ON b.computer_id = c.id
        WHERE b.user_id = ?
        ORDER BY b.start_time DESC
    """, (current_user["id"],))
    
    return [
        BookingResponse(
            id=booking["id"],
            user_id=booking["user_id"],
            computer_id=booking["computer_id"],
            start_time=booking["start_time"],
            end_time=booking["end_time"],
            status=booking["status"],
            computer_name=booking["computer_name"],
            computer_location=booking["location"],
            computer_description=booking["description"],
            username=current_user["username"],
            fullname=current_user["fullname"],
            created_at=booking["created_at"]
        )
        for booking in bookings
    ]

@router.post("/", response_model=dict)
async def create_booking(
    booking: BookingCreate, 
    current_user: dict = Depends(get_current_user)
):
    """Create a new booking"""
    # Check if computer exists
    computers = execute_query(
        "SELECT id FROM computers WHERE id = ?", 
        (booking.computer_id,)
    )
    if not computers:
        raise HTTPException(status_code=404, detail="Computer not found")
    
    # Check for time conflicts
    conflicting_bookings = execute_query("""
        SELECT COUNT(*) as count FROM bookings
        WHERE computer_id = ?
        AND status IN ('pending', 'active')
        AND (
            (start_time <= ? AND end_time > ?)
            OR (start_time < ? AND end_time >= ?)
            OR (start_time >= ? AND end_time <= ?)
        )
    """, (
        booking.computer_id,
        booking.start_time.isoformat(),
        booking.start_time.isoformat(),
        booking.end_time.isoformat(),
        booking.end_time.isoformat(),
        booking.start_time.isoformat(),
        booking.end_time.isoformat()
    ))
    
    if conflicting_bookings[0]["count"] > 0:
        raise HTTPException(
            status_code=400,
            detail="Computer is already booked for this time slot"
        )
    
    # Check user's concurrent booking limit
    group_limits = execute_query(
        "SELECT max_concurrent_bookings FROM group_limits WHERE group_name = ?",
        (current_user["group_name"],)
    )
    max_bookings = group_limits[0]["max_concurrent_bookings"] if group_limits else 1
    
    current_bookings = execute_query("""
        SELECT COUNT(*) as count FROM bookings
        WHERE user_id = ?
        AND status IN ('pending', 'active')
        AND (
            (start_time <= ? AND end_time > ?)
            OR (start_time < ? AND end_time >= ?)
            OR (start_time >= ? AND end_time <= ?)
        )
    """, (
        current_user["id"],
        booking.start_time.isoformat(),
        booking.start_time.isoformat(),
        booking.end_time.isoformat(),
        booking.end_time.isoformat(),
        booking.start_time.isoformat(),
        booking.end_time.isoformat()
    ))
    
    if current_bookings[0]["count"] >= max_bookings:
        raise HTTPException(
            status_code=403,
            detail=f"You can only book {max_bookings} computer(s) at the same time"
        )
    
    # Create booking
    booking_id = execute_insert("""
        INSERT INTO bookings (user_id, computer_id, start_time, end_time, status)
        VALUES (?, ?, ?, ?, 'pending')
    """, (
        current_user["id"],
        booking.computer_id,
        booking.start_time.isoformat(),
        booking.end_time.isoformat()
    ))
    
    # Create session with unlock code
    unlock_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    execute_insert("""
        INSERT INTO sessions (booking_id, unlock_code, status)
        VALUES (?, ?, 'locked')
    """, (booking_id, unlock_code))
    
    return {
        "message": "Booking created successfully",
        "booking_id": booking_id,
        "unlock_code": unlock_code
    }

@router.delete("/{booking_id}")
async def cancel_booking(booking_id: int, current_user: dict = Depends(get_current_user)):
    """Cancel a booking"""
    # Check if booking exists and belongs to user
    bookings = execute_query("""
        SELECT * FROM bookings 
        WHERE id = ? AND user_id = ?
    """, (booking_id, current_user["id"]))
    
    if not bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    booking = bookings[0]
    
    # Check if booking can be cancelled
    if booking["status"] == "completed":
        raise HTTPException(
            status_code=400,
            detail="Cannot cancel completed booking"
        )
    
    # Update booking status
    execute_update(
        "UPDATE bookings SET status = 'cancelled' WHERE id = ?",
        (booking_id,)
    )
    
    return {"message": "Booking cancelled successfully"}
