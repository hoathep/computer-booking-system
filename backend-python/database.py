import sqlite3
import os
from datetime import datetime
from typing import Optional, List, Dict, Any

DATABASE_PATH = "booking.db"

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_database():
    """Initialize database with tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            fullname TEXT NOT NULL,
            email TEXT,
            group_name TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Computers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS computers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            location TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Bookings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            computer_id INTEGER NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (computer_id) REFERENCES computers (id)
        )
    ''')
    
    # Sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            booking_id INTEGER NOT NULL,
            unlock_code TEXT NOT NULL,
            status TEXT DEFAULT 'locked',
            unlocked_at TIMESTAMP,
            locked_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings (id)
        )
    ''')
    
    # Group limits table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS group_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            group_name TEXT UNIQUE NOT NULL,
            max_concurrent_bookings INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Insert default data
    insert_default_data(cursor)
    
    conn.commit()
    conn.close()

def insert_default_data(cursor):
    """Insert default data"""
    # Check if admin user exists
    cursor.execute("SELECT COUNT(*) FROM users WHERE username = 'admin'")
    if cursor.fetchone()[0] == 0:
        # Create admin user (password: admin123)
        cursor.execute('''
            INSERT INTO users (username, password_hash, fullname, group_name)
            VALUES ('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2O', 'Administrator', 'admin')
        ''')
    
    # Check if computers exist
    cursor.execute("SELECT COUNT(*) FROM computers")
    if cursor.fetchone()[0] == 0:
        # Insert sample computers
        computers = [
            ('PC-01', 'High-performance workstation', 'Room A-101'),
            ('PC-02', 'Gaming computer with RTX 4080', 'Room A-102'),
            ('PC-03', 'Development machine', 'Room A-103'),
            ('PC-04', 'AI/ML workstation', 'Room A-104'),
            ('PC-05', 'General purpose computer', 'Room A-105'),
            ('PC-06', 'Backup computer', 'Room A-106')
        ]
        
        for name, description, location in computers:
            cursor.execute('''
                INSERT INTO computers (name, description, location)
                VALUES (?, ?, ?)
            ''', (name, description, location))
    
    # Check if group limits exist
    cursor.execute("SELECT COUNT(*) FROM group_limits")
    if cursor.fetchone()[0] == 0:
        # Insert default group limits
        cursor.execute('''
            INSERT INTO group_limits (group_name, max_concurrent_bookings)
            VALUES ('user', 1), ('admin', 5)
        ''')

# Database utility functions
def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute SELECT query and return results"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    results = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return results

def execute_update(query: str, params: tuple = ()) -> int:
    """Execute INSERT/UPDATE/DELETE query and return affected rows"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    affected_rows = cursor.rowcount
    conn.commit()
    conn.close()
    return affected_rows

def execute_insert(query: str, params: tuple = ()) -> int:
    """Execute INSERT query and return last inserted ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    last_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return last_id
