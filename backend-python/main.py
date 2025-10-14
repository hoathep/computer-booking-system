from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import sqlite3
import os
from datetime import datetime, timedelta
from typing import Optional, List
import uvicorn

from database import init_database
from routes import auth, bookings, computers, admin, client

# Initialize FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_database()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🔄 Server shutting down")

app = FastAPI(
    title="Computer Booking System API",
    description="API for managing computer bookings with ML/AI capabilities",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(computers.router, prefix="/api/computers", tags=["Computers"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(client.router, prefix="/api/client", tags=["Client"])

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Python FastAPI server is running"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=3000, 
        reload=True,
        log_level="info"
    )
