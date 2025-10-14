from fastapi import APIRouter, HTTPException
from datetime import datetime

from database import execute_query, execute_update
from models import UnlockRequest, UnlockResponse, UnlockCodeRequest

router = APIRouter()

@router.post("/check-unlock", response_model=UnlockResponse)
async def check_unlock(request: UnlockRequest):
    """Check if computer should be unlocked"""
    computer_id = request.computer_id
    
    if not computer_id:
        raise HTTPException(status_code=400, detail="Computer ID required")
    
    # Find active booking for this computer
    now = datetime.now().isoformat()
    
    bookings = execute_query("""
        SELECT 
            b.*,
            u.fullname,
            s.unlock_code,
            s.status as session_status
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        LEFT JOIN sessions s ON s.booking_id = b.id
        WHERE b.computer_id = ?
        AND b.status IN ('pending', 'active')
        AND ? >= b.start_time
        AND ? <= b.end_time
        ORDER BY b.start_time
        LIMIT 1
    """, (computer_id, now, now))
    
    if not bookings:
        return UnlockResponse(
            should_unlock=False,
            message="No active booking found"
        )
    
    booking = bookings[0]
    
    # Update booking status to active if it's pending
    if booking["status"] == "pending":
        execute_update(
            "UPDATE bookings SET status = 'active' WHERE id = ?",
            (booking["id"],)
        )
    
    # Check if session should be unlocked
    start_time = datetime.fromisoformat(booking["start_time"])
    end_time = datetime.fromisoformat(booking["end_time"])
    current_time = datetime.now()
    
    should_unlock = start_time <= current_time <= end_time
    
    return UnlockResponse(
        should_unlock=should_unlock,
        booking={
            "id": booking["id"],
            "user": booking["fullname"],
            "start_time": booking["start_time"],
            "end_time": booking["end_time"],
            "unlock_code": booking["unlock_code"]
        },
        message="Computer is ready to use" if should_unlock else "Booking time has not started yet"
    )

@router.post("/unlock")
async def unlock_computer(request: UnlockCodeRequest):
    """Unlock computer with code"""
    computer_id = request.computer_id
    unlock_code = request.unlock_code
    
    if not computer_id or not unlock_code:
        raise HTTPException(status_code=400, detail="Computer ID and unlock code required")
    
    # Find active booking with matching unlock code
    now = datetime.now().isoformat()
    
    bookings = execute_query("""
        SELECT b.*, s.id as session_id
        FROM bookings b
        JOIN sessions s ON s.booking_id = b.id
        WHERE b.computer_id = ?
        AND b.status = 'active'
        AND s.unlock_code = ?
        AND ? >= b.start_time
        AND ? <= b.end_time
    """, (computer_id, unlock_code, now, now))
    
    if not bookings:
        raise HTTPException(
            status_code=400,
            detail="Invalid unlock code or booking not found"
        )
    
    booking = bookings[0]
    
    # Update session status
    execute_update(
        "UPDATE sessions SET status = 'unlocked', unlocked_at = ? WHERE id = ?",
        (now, booking["session_id"])
    )
    
    return {
        "success": True,
        "message": "Computer unlocked successfully"
    }

@router.post("/lock")
async def lock_computer(request: UnlockRequest):
    """Lock computer (when time is up)"""
    computer_id = request.computer_id
    
    if not computer_id:
        raise HTTPException(status_code=400, detail="Computer ID required")
    
    now = datetime.now().isoformat()
    
    # Update all expired bookings
    execute_update("""
        UPDATE bookings 
        SET status = 'completed'
        WHERE computer_id = ?
        AND status = 'active'
        AND end_time <= ?
    """, (computer_id, now))
    
    # Lock all sessions
    execute_update("""
        UPDATE sessions 
        SET status = 'locked', locked_at = ?
        WHERE booking_id IN (
            SELECT id FROM bookings 
            WHERE computer_id = ? AND status = 'completed'
        )
    """, (now, computer_id))
    
    return {
        "success": True,
        "message": "Computer locked successfully"
    }
