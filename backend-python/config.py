import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-here-change-in-production")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./booking.db")
