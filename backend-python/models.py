from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User models
class UserCreate(BaseModel):
    username: str
    password: str
    fullname: str
    email: Optional[str] = None
    group_name: str = "user"

class UserResponse(BaseModel):
    id: int
    username: str
    fullname: str
    email: Optional[str]
    group_name: str
    created_at: datetime

class UserLogin(BaseModel):
    username: str
    password: str

# Computer models
class ComputerCreate(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None

class ComputerResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    location: Optional[str]
    is_currently_booked: bool = False
    is_currently_in_use: bool = False
    is_booked_future: bool = False
    created_at: datetime

# Booking models
class BookingCreate(BaseModel):
    computer_id: int
    start_time: datetime
    end_time: datetime

class BookingResponse(BaseModel):
    id: int
    user_id: int
    computer_id: int
    start_time: datetime
    end_time: datetime
    status: str
    computer_name: Optional[str] = None
    computer_location: Optional[str] = None
    computer_description: Optional[str] = None
    username: Optional[str] = None
    fullname: Optional[str] = None
    created_at: datetime

# Session models
class SessionResponse(BaseModel):
    id: int
    booking_id: int
    unlock_code: str
    status: str
    unlocked_at: Optional[datetime]
    locked_at: Optional[datetime]
    created_at: datetime

# Admin models
class AdminStats(BaseModel):
    total_users: int
    total_computers: int
    active_bookings: int
    today_bookings: int

# Client models
class UnlockRequest(BaseModel):
    computer_id: int

class UnlockResponse(BaseModel):
    should_unlock: bool
    booking: Optional[dict] = None
    message: str

class UnlockCodeRequest(BaseModel):
    computer_id: int
    unlock_code: str

# Token models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
