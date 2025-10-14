from fastapi import APIRouter, Depends, HTTPException
from typing import List
from datetime import datetime

from database import execute_query, execute_update
from models import ComputerResponse, ComputerCreate
from routes.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ComputerResponse])
async def get_computers(current_user: dict = Depends(get_current_user)):
    """Get all computers with availability status"""
    # First, clean up expired bookings
    now = datetime.now().isoformat()
    execute_update(
        """UPDATE bookings 
           SET status = 'completed'
           WHERE status IN ('pending', 'active')
           AND end_time <= ?""",
        (now,)
    )

    # Get computers with status
    computers = execute_query("""
        SELECT 
            c.*,
            (
                SELECT COUNT(*) 
                FROM bookings b 
                WHERE b.computer_id = c.id 
                AND b.status = 'active'
                AND datetime('now') BETWEEN b.start_time AND b.end_time
            ) as is_currently_in_use,
            (
                SELECT COUNT(*) 
                FROM bookings b 
                WHERE b.computer_id = c.id 
                AND b.status = 'pending'
                AND datetime('now') < b.start_time
            ) as is_booked_future,
            (
                SELECT COUNT(*) 
                FROM bookings b 
                WHERE b.computer_id = c.id 
                AND b.status IN ('pending', 'active')
                AND datetime('now') BETWEEN b.start_time AND b.end_time
            ) as is_currently_booked
        FROM computers c
        ORDER BY c.name
    """)

    return [
        ComputerResponse(
            id=computer["id"],
            name=computer["name"],
            description=computer["description"],
            location=computer["location"],
            is_currently_booked=bool(computer["is_currently_booked"]),
            is_currently_in_use=bool(computer["is_currently_in_use"]),
            is_booked_future=bool(computer["is_booked_future"]),
            created_at=computer["created_at"]
        )
        for computer in computers
    ]

@router.get("/{computer_id}", response_model=ComputerResponse)
async def get_computer(computer_id: int, current_user: dict = Depends(get_current_user)):
    """Get computer by ID"""
    computers = execute_query(
        "SELECT * FROM computers WHERE id = ?", 
        (computer_id,)
    )
    
    if not computers:
        raise HTTPException(status_code=404, detail="Computer not found")
    
    computer = computers[0]
    return ComputerResponse(
        id=computer["id"],
        name=computer["name"],
        description=computer["description"],
        location=computer["location"],
        is_currently_booked=False,
        is_currently_in_use=False,
        is_booked_future=False,
        created_at=computer["created_at"]
    )

@router.get("/{computer_id}/bookings")
async def get_computer_bookings(
    computer_id: int, 
    start_date: str = None, 
    end_date: str = None,
    current_user: dict = Depends(get_current_user)
):
    """Get computer bookings for calendar view"""
    query = """
        SELECT 
            b.*,
            u.username,
            u.fullname
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        WHERE b.computer_id = ?
        AND b.status IN ('pending', 'active', 'completed')
    """
    params = [computer_id]
    
    if start_date and end_date:
        query += " AND b.start_time >= ? AND b.end_time <= ?"
        params.extend([start_date, end_date])
    
    query += " ORDER BY b.start_time"
    
    bookings = execute_query(query, tuple(params))
    return bookings
