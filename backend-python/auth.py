from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
import os

from database import execute_query, execute_insert
from models import UserCreate, UserResponse, UserLogin, Token, TokenData

router = APIRouter()
security = HTTPBearer()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    return token_data

def get_current_user(token_data: TokenData = Depends(verify_token)):
    """Get current user from token"""
    user = execute_query(
        "SELECT * FROM users WHERE username = ?", 
        (token_data.username,)
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    return user[0]

@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    """Register new user"""
    # Check if user exists
    existing_user = execute_query(
        "SELECT id FROM users WHERE username = ?", 
        (user.username,)
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Hash password
    hashed_password = get_password_hash(user.password)
    
    # Create user
    user_id = execute_insert(
        """INSERT INTO users (username, password_hash, fullname, email, group_name) 
           VALUES (?, ?, ?, ?, ?)""",
        (user.username, hashed_password, user.fullname, user.email, user.group_name)
    )
    
    # Return user data
    new_user = execute_query(
        "SELECT * FROM users WHERE id = ?", 
        (user_id,)
    )[0]
    
    return UserResponse(
        id=new_user["id"],
        username=new_user["username"],
        fullname=new_user["fullname"],
        email=new_user["email"],
        group_name=new_user["group_name"],
        created_at=new_user["created_at"]
    )

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    """Login user"""
    # Get user from database
    users = execute_query(
        "SELECT * FROM users WHERE username = ?", 
        (user.username,)
    )
    
    if not users or not verify_password(user.password, users[0]["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    # Create token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        fullname=current_user["fullname"],
        email=current_user["email"],
        group_name=current_user["group_name"],
        created_at=current_user["created_at"]
    )
