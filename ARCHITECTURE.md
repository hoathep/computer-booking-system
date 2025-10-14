# 🏗️ Kiến trúc hệ thống

## Tổng quan

Computer Booking System là một ứng dụng full-stack sử dụng kiến trúc 3-tier:
1. **Presentation Layer** - React Frontend
2. **Application Layer** - Express.js Backend API
3. **Data Layer** - SQLite Database

## Sơ đồ kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌────────────────────┐        │
│  │   Web Browser    │         │   Client App       │        │
│  │   (React App)    │         │   (Node.js)        │        │
│  │   Port: 5173     │         │   Desktop Client   │        │
│  └──────────────────┘         └────────────────────┘        │
│           │                              │                   │
│           │ HTTP/REST                    │ HTTP/REST         │
│           ▼                              ▼                   │
└───────────────────────────────────────────────────────────┬─┘
                                                             │
┌───────────────────────────────────────────────────────────┴─┐
│                      API GATEWAY LAYER                       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Express.js Server (Port: 3000)                │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │   Routes     │  │  Middleware  │  │  Auth       │ │ │
│  │  │  /api/*      │→ │  JWT Auth    │→ │  bcryptjs   │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                              │                               │
└──────────────────────────────┼───────────────────────────────┘
                               ▼
┌──────────────────────────────────────────────────────────────┐
│                       DATA LAYER                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │            SQLite Database (booking.db)                │ │
│  │                                                         │ │
│  │  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │ users   │ │ computers │ │ bookings │ │ sessions │ │ │
│  │  └─────────┘ └───────────┘ └──────────┘ └──────────┘ │ │
│  │       │            │              │            │       │ │
│  │       └────────────┴──────────────┴────────────┘       │ │
│  │              ┌──────────────┐                          │ │
│  │              │ group_limits │                          │ │
│  │              └──────────────┘                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Chi tiết từng layer

### 1. Client Layer

#### Web Frontend (React)
```
client/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Layout.jsx     # Main layout wrapper
│   │   ├── AdminLayout.jsx
│   │   └── ProtectedRoute.jsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.jsx # Authentication state
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Computers.jsx
│   │   ├── MyBookings.jsx
│   │   └── admin/         # Admin pages
│   ├── App.jsx            # Root component with routing
│   └── main.jsx           # Entry point
```

**Công nghệ:**
- React 18 (UI framework)
- React Router v6 (Routing)
- Axios (HTTP client)
- Tailwind CSS (Styling)
- Vite (Build tool)

**Flow:**
1. User truy cập → React Router xác định route
2. ProtectedRoute kiểm tra authentication
3. Page component render
4. Component gọi API qua Axios
5. AuthContext quản lý user state

#### Desktop Client App (Node.js)
```
client-app/
├── index.js        # Main application
├── package.json
└── .env            # Configuration
```

**Công nghệ:**
- Node.js (Runtime)
- Axios (HTTP client)
- node-schedule (Scheduling)
- chalk (Console styling)

**Flow:**
1. App start → Đọc config từ .env
2. Interval timer → Check booking every X seconds
3. API call → `/api/client/check-unlock`
4. If booking found → Unlock computer
5. When time ends → Lock computer

### 2. API Layer

#### Express.js Backend
```
server/
├── database/
│   └── init.js           # Database initialization
├── middleware/
│   └── auth.js           # JWT authentication
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── computers.js      # Computer management
│   ├── bookings.js       # Booking management
│   ├── admin.js          # Admin operations
│   └── client.js         # Client app endpoints
└── index.js              # Server entry point
```

**API Design:**
- RESTful principles
- JWT-based authentication
- Role-based access control
- Error handling middleware

**Endpoints Structure:**
```
/api
├── /auth
│   ├── POST /login
│   ├── POST /register
│   └── GET /me
├── /computers
│   ├── GET /
│   ├── GET /:id
│   └── GET /:id/bookings
├── /bookings
│   ├── GET /my-bookings
│   ├── GET /active
│   ├── POST /
│   └── DELETE /:id
├── /admin (Protected)
│   ├── /users
│   ├── /computers
│   ├── /bookings
│   ├── /groups
│   └── GET /stats
└── /client
    ├── POST /check-unlock
    ├── POST /unlock
    └── POST /lock
```

### 3. Data Layer

#### Database Schema

```sql
users
├── id (PK)
├── username (UNIQUE)
├── password (hashed)
├── fullname
├── email
├── role (user/admin)
├── group_name (FK → group_limits)
├── max_concurrent_bookings
└── created_at

computers
├── id (PK)
├── name (UNIQUE)
├── description
├── location
├── status (available/maintenance/disabled)
├── ip_address
├── mac_address
└── created_at

bookings
├── id (PK)
├── user_id (FK → users)
├── computer_id (FK → computers)
├── start_time
├── end_time
├── status (pending/active/completed/cancelled)
└── created_at

group_limits
├── id (PK)
├── group_name (UNIQUE)
├── max_concurrent_bookings
└── created_at

sessions
├── id (PK)
├── booking_id (FK → bookings)
├── unlock_code
├── unlocked_at
├── locked_at
└── status (locked/unlocked)
```

**Relationships:**
- User 1:N Bookings
- Computer 1:N Bookings
- Booking 1:1 Session
- Group 1:N Users

## Data Flow

### User Booking Flow
```
1. User Login
   Web → POST /api/auth/login → JWT Token

2. View Computers
   Web → GET /api/computers → Computer List

3. Create Booking
   Web → POST /api/bookings
       → Check user limit
       → Check computer availability
       → Create booking
       → Create session with unlock code
       → Return success + unlock code

4. View My Bookings
   Web → GET /api/bookings/my-bookings → Booking List
```

### Client App Unlock Flow
```
1. Check Booking
   Client → POST /api/client/check-unlock
         → Query active booking for computer_id
         → Check time validity
         → Return booking info

2. Unlock Computer
   Client → POST /api/client/unlock
         → Validate unlock code
         → Update session status
         → Return success
   Client → Execute OS unlock command

3. Lock Computer (Time's up)
   Client → POST /api/client/lock
         → Update booking status to completed
         → Update session status to locked
   Client → Execute OS lock command
```

### Admin Management Flow
```
1. View Dashboard
   Admin → GET /api/admin/stats → Statistics

2. Manage Users
   Admin → GET /api/admin/users → User List
   Admin → POST /api/admin/users → Create User
   Admin → PUT /api/admin/users/:id → Update User

3. Manage Computers
   Admin → GET /api/admin/computers → Computer List
   Admin → POST /api/admin/computers → Create Computer

4. Manage Groups
   Admin → GET /api/admin/groups → Group List
   Admin → POST /api/admin/groups → Create/Update Group
```

## Security Architecture

### Authentication Flow
```
1. User Login
   ├── Client sends username + password
   ├── Server validates credentials
   ├── Server generates JWT token
   │   └── Payload: { id, username, role, exp }
   └── Client stores token in localStorage

2. Authenticated Request
   ├── Client sends request with Authorization header
   │   └── "Bearer <token>"
   ├── Server verifies JWT
   ├── Server extracts user info
   └── Server processes request
```

### Authorization Levels
1. **Public**: Login, Register
2. **Authenticated**: All user features
3. **Admin**: Admin panel features

## Scalability Considerations

### Current Architecture
- Single server deployment
- SQLite for simplicity
- No caching layer
- No load balancing

### Future Scalability
```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└───────────┬─────────────────────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
┌─────────┐   ┌─────────┐
│ Server 1│   │ Server 2│
└────┬────┘   └────┬────┘
     │             │
     └──────┬──────┘
            ▼
    ┌──────────────┐
    │  PostgreSQL  │
    └──────────────┘
            │
    ┌──────────────┐
    │    Redis     │
    │   (Cache)    │
    └──────────────┘
```

**Improvements:**
- PostgreSQL cho production
- Redis cho session & cache
- PM2 cho process management
- Nginx cho load balancing
- Docker cho containerization

## Performance Optimizations

### Frontend
- Code splitting với React.lazy()
- Image optimization
- Memoization (React.memo, useMemo)
- Virtual scrolling cho large lists

### Backend
- Database indexing
- Query optimization
- Connection pooling
- Caching frequent queries
- Rate limiting

### Database
- Indexes trên foreign keys
- Indexes trên search fields
- Query optimization
- Regular VACUUM (SQLite)

## Monitoring & Logging

### Current Implementation
- Console logging
- Error catching
- Basic health check endpoint

### Production Requirements
- Structured logging (Winston)
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Database monitoring
- API analytics

## Deployment Architecture

### Development
```
Local Machine
├── Backend (localhost:3000)
├── Frontend (localhost:5173)
└── Database (local SQLite file)
```

### Production
```
Server
├── Nginx (Port 80/443)
│   ├── Reverse proxy to backend
│   └── Serve frontend static files
├── Backend (PM2)
│   └── Multiple instances
├── Database
│   └── PostgreSQL/MySQL
└── Client App
    └── Systemd service on each computer
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 | UI Framework |
| Styling | Tailwind CSS | CSS Framework |
| Routing | React Router v6 | Client-side routing |
| HTTP Client | Axios | API requests |
| Backend | Express.js | Web framework |
| Database | SQLite | Data storage |
| Auth | JWT | Authentication |
| Password | bcryptjs | Password hashing |
| Client App | Node.js | Desktop application |
| Scheduling | node-schedule | Cron jobs |

## Best Practices Implemented

1. ✅ Separation of concerns
2. ✅ RESTful API design
3. ✅ JWT authentication
4. ✅ Password hashing
5. ✅ Input validation
6. ✅ Error handling
7. ✅ Environment variables
8. ✅ Git ignore sensitive files
9. ✅ Modular code structure
10. ✅ Consistent naming conventions

---

**Document Version:** 1.0  
**Last Updated:** 2024


