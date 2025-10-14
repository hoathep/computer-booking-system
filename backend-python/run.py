#!/usr/bin/env python3
"""
Run the Python FastAPI backend server
"""
import uvicorn
from main import app

if __name__ == "__main__":
    print("🚀 Starting Python FastAPI Backend...")
    print("📊 Ready for ML/AI integration!")
    print("🌐 Server will be available at: http://localhost:3000")
    print("📚 API docs at: http://localhost:3000/docs")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=3000,
        reload=True,
        log_level="info"
    )
