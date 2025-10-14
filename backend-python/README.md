# Computer Booking System - Python Backend

A modern Python FastAPI backend for the Computer Booking System, designed for ML/AI integration.

## Features

- 🚀 **FastAPI** - Modern, fast web framework
- 🔐 **JWT Authentication** - Secure token-based auth
- 📊 **SQLite Database** - Lightweight, file-based database
- 🤖 **ML/AI Ready** - Easy integration with Python ML libraries
- 📚 **Auto Documentation** - Interactive API docs at `/docs`
- 🌐 **CORS Support** - Frontend integration ready

## Installation

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run the server:**
```bash
python run.py
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Computers
- `GET /api/computers` - Get all computers with status
- `GET /api/computers/{id}` - Get computer by ID
- `GET /api/computers/{id}/bookings` - Get computer bookings

### Bookings
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/my-bookings` - Get user's bookings
- `POST /api/bookings` - Create new booking
- `DELETE /api/bookings/{id}` - Cancel booking
- `POST /api/bookings/cleanup` - Cleanup expired bookings

### Admin
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/computers` - Get all computers
- `GET /api/admin/bookings` - Get all bookings
- `DELETE /api/admin/bookings/{id}` - Delete booking

### Client
- `POST /api/client/check-unlock` - Check if computer should unlock
- `POST /api/client/unlock` - Unlock computer with code
- `POST /api/client/lock` - Lock computer

## ML/AI Integration Ready

This backend is designed for easy ML/AI integration:

### Recommended ML Libraries
```bash
pip install scikit-learn pandas numpy matplotlib seaborn
pip install tensorflow torch transformers
pip install fastapi[all] uvicorn
```

### Example ML Integration
```python
# Add to routes/analytics.py
from sklearn.ensemble import RandomForestRegressor
import pandas as pd

@router.post("/predict-usage")
async def predict_computer_usage():
    # Load booking data
    bookings = execute_query("SELECT * FROM bookings")
    df = pd.DataFrame(bookings)
    
    # Train ML model
    model = RandomForestRegressor()
    # ... training logic
    
    return {"prediction": "ML prediction here"}
```

## Database Schema

- **users** - User accounts and authentication
- **computers** - Available computers
- **bookings** - Computer reservations
- **sessions** - Unlock sessions
- **group_limits** - User group limits

## Development

1. **Start development server:**
```bash
python run.py
```

2. **View API documentation:**
   - Swagger UI: http://localhost:3000/docs
   - ReDoc: http://localhost:3000/redoc

3. **Test endpoints:**
```bash
curl http://localhost:3000/api/health
```

## Production Deployment

For production, consider:
- PostgreSQL instead of SQLite
- Redis for caching
- Docker containerization
- Environment variables for secrets
- HTTPS/SSL certificates
