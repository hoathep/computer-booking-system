from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from database import execute_query, execute_insert, execute_update
from models import AdminStats, UserResponse, ComputerResponse, BookingResponse
from routes.auth import get_current_user

router = APIRouter()

def require_admin(current_user: dict = Depends(get_current_user)):
    """Require admin privileges"""
    if current_user["group_name"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(admin_user: dict = Depends(require_admin)):
    """Get admin statistics"""
    # Get total users
    total_users = execute_query("SELECT COUNT(*) as count FROM users")[0]["count"]
    
    # Get total computers
    total_computers = execute_query("SELECT COUNT(*) as count FROM computers")[0]["count"]
    
    # Get active bookings
    active_bookings = execute_query("""
        SELECT COUNT(*) as count FROM bookings 
        WHERE status IN ('pending', 'active')
    """)[0]["count"]
    
    # Get today's bookings
    today = datetime.now().date().isoformat()
    today_bookings = execute_query("""
        SELECT COUNT(*) as count FROM bookings 
        WHERE DATE(start_time) = ?
    """, (today,))[0]["count"]
    
    return AdminStats(
        total_users=total_users,
        total_computers=total_computers,
        active_bookings=active_bookings,
        today_bookings=today_bookings
    )

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin_user: dict = Depends(require_admin)):
    """Get all users"""
    users = execute_query("SELECT * FROM users ORDER BY created_at DESC")
    
    return [
        UserResponse(
            id=user["id"],
            username=user["username"],
            fullname=user["fullname"],
            email=user["email"],
            group_name=user["group_name"],
            created_at=user["created_at"]
        )
        for user in users
    ]

@router.get("/computers", response_model=List[ComputerResponse])
async def get_all_computers(admin_user: dict = Depends(require_admin)):
    """Get all computers"""
    computers = execute_query("SELECT * FROM computers ORDER BY name")
    
    return [
        ComputerResponse(
            id=computer["id"],
            name=computer["name"],
            description=computer["description"],
            location=computer["location"],
            is_currently_booked=False,
            is_currently_in_use=False,
            is_booked_future=False,
            created_at=computer["created_at"]
        )
        for computer in computers
    ]

@router.get("/bookings", response_model=List[BookingResponse])
async def get_all_bookings(admin_user: dict = Depends(require_admin)):
    """Get all bookings"""
    bookings = execute_query("""
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
        ORDER BY b.start_time DESC
    """)
    
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

@router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: int, admin_user: dict = Depends(require_admin)):
    """Delete a booking"""
    # Check if booking exists
    bookings = execute_query("SELECT id FROM bookings WHERE id = ?", (booking_id,))
    if not bookings:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Delete booking
    execute_update("DELETE FROM bookings WHERE id = ?", (booking_id,))
    
    return {"message": "Booking deleted successfully"}
