# 💻 Computer Booking System - Beta 0.2

Hệ thống quản lý đặt máy tính trực tuyến với giao diện hiện đại, hỗ trợ đa người dùng, phân quyền admin, và tự động mở khóa máy khi đến giờ.

**Phiên bản:** Beta 0.2  
**Trạng thái:** Development & Testing  
**Ngày cập nhật:** 2024-2025

## ✨ Tính năng

### 🎯 Dành cho User
- ✅ Đăng ký và đăng nhập tài khoản
- ✅ Xem danh sách máy tính có sẵn
- ✅ Đặt lịch sử dụng máy với thời gian tùy chọn
- ✅ Xem lịch sử và trạng thái booking
- ✅ Hủy booking (trước khi bắt đầu)
- ✅ Giới hạn số máy có thể đặt cùng lúc
- ✅ Đánh giá máy tính sau khi sử dụng (1-5 sao)
- ✅ Xem máy "hot" (được đặt nhiều nhất)
- ✅ Nhận mật khẩu đăng nhập qua email
- ✅ Hỗ trợ đa ngôn ngữ (Tiếng Việt, English, 日本語)

### 👨‍💼 Dành cho Admin
- ✅ Quản lý người dùng (thêm, sửa, xóa)
- ✅ Quản lý máy tính (thêm, sửa, xóa, cập nhật trạng thái)
- ✅ Quản lý booking (xem tất cả, xóa)
- ✅ Quản lý nhóm người dùng và giới hạn booking
- ✅ Dashboard thống kê tổng quan
- ✅ Đặt giới hạn booking theo nhóm hoặc từng user
- ✅ Báo cáo tổng hợp với biểu đồ thời gian
- ✅ Xuất báo cáo ra file Excel
- ✅ Quản lý cài đặt email SMTP
- ✅ Quản lý cài đặt footer hệ thống
- ✅ Import/Export danh sách nhóm
- ✅ Quản lý đa ngôn ngữ

### 🖥️ Client App
- ✅ Tự động kiểm tra booking từ server
- ✅ Mở khóa máy khi đến giờ đặt
- ✅ Khóa máy khi hết thời gian
- ✅ Hiển thị thông tin booking real-time

## 🏗️ Kiến trúc

```
computer-booking-system/
├── server/              # Backend API (Node.js + Express + SQLite)
│   ├── database/        # Database initialization
│   ├── middleware/      # Authentication middleware
│   └── routes/          # API routes
├── client/              # Frontend Web App (React + Tailwind CSS)
│   └── src/
│       ├── components/  # Reusable components
│       ├── contexts/    # React contexts (Auth)
│       └── pages/       # Page components
└── client-app/          # Client Desktop App (Node.js)
    └── index.js         # Auto unlock/lock manager
```

## 🛠️ Công nghệ

### Backend
- Node.js + Express
- SQLite (better-sqlite3)
- JWT Authentication
- bcryptjs (Password hashing)
- Nodemailer (Email sending)
- ExcelJS (Excel export)
- Multer (File upload)

### Frontend
- React 18
- React Router v6
- Tailwind CSS
- Axios
- Lucide Icons
- date-fns
- i18next (Internationalization)
- Chart.js (Data visualization)

### Client App
- Node.js
- Axios
- Chalk (Terminal colors)
- node-schedule

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone <repository-url>
cd computer-booking-system
```

### 2. Cài đặt Backend
```bash
npm install
```

### 3. Cài đặt Frontend
```bash
cd client
npm install
cd ..
```

### 4. Cài đặt Client App
```bash
cd client-app
npm install
cd ..
```

### 5. Cấu hình
Backend tự động sử dụng file `.env` (có sẵn), bạn có thể thay đổi:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

Client App cần tạo file `.env`:
```bash
cd client-app
cp .env.example .env
```

Sửa file `.env`:
```env
SERVER_URL=http://localhost:3000
COMPUTER_ID=1
CHECK_INTERVAL=10
```

## 🚀 Chạy ứng dụng

### Development (Toàn bộ hệ thống)
```bash
npm run dev
```
Lệnh này sẽ chạy cả Backend và Frontend cùng lúc.

### Hoặc chạy riêng từng phần:

#### Backend
```bash
npm run server
```
Server chạy tại: http://localhost:3000

#### Frontend
```bash
cd client
npm run dev
```
Web app chạy tại: http://localhost:5173

#### Client App (trên máy tính cần mở khóa)
```bash
cd client-app
npm start
```

## 👤 Tài khoản mặc định

### Admin
- **Username:** admin
- **Password:** admin123

### User (nếu đã tạo)
- Đăng ký tài khoản mới tại trang Register

## 📱 Sử dụng

### Dành cho User

1. **Đăng nhập**
   - Truy cập http://localhost:5173
   - Đăng nhập hoặc đăng ký tài khoản mới

2. **Đặt máy**
   - Vào mục "Đặt máy"
   - Chọn máy tính có sẵn
   - Chọn thời gian bắt đầu và kết thúc
   - Xác nhận đặt

3. **Quản lý booking**
   - Vào "Lịch của tôi" để xem tất cả booking
   - Có thể hủy booking chưa bắt đầu

### Dành cho Admin

1. **Đăng nhập Admin**
   - Đăng nhập với tài khoản admin
   - Click nút "Admin" trên header

2. **Quản lý Users**
   - Thêm/Sửa/Xóa users
   - Đặt giới hạn booking cho từng user
   - Phân vào nhóm

3. **Quản lý Máy**
   - Thêm/Sửa/Xóa máy tính
   - Cập nhật IP, MAC address
   - Đặt trạng thái (Available/Maintenance/Disabled)

4. **Quản lý Nhóm**
   - Tạo nhóm mới
   - Đặt giới hạn booking cho nhóm
   - User trong nhóm sẽ kế thừa giới hạn (nếu không có giới hạn riêng)

### Client App (Cài trên máy tính)

1. **Cấu hình**
   - Đặt `COMPUTER_ID` tương ứng với ID máy trong hệ thống
   - Đặt `SERVER_URL` trỏ đến server backend

2. **Chạy**
   ```bash
   cd client-app
   npm start
   ```

3. **Hoạt động**
   - App sẽ tự động kiểm tra booking mỗi 10 giây
   - Khi có booking hợp lệ → Tự động mở khóa
   - Khi hết thời gian → Tự động khóa lại

## 📝 API Documentation

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Computers
- `GET /api/computers` - Lấy danh sách máy
- `GET /api/computers/:id` - Lấy thông tin 1 máy
- `GET /api/computers/:id/bookings` - Lấy bookings của máy

### Bookings
- `GET /api/bookings/my-bookings` - Lấy bookings của user
- `GET /api/bookings/active` - Lấy bookings đang hoạt động
- `POST /api/bookings` - Tạo booking mới
- `DELETE /api/bookings/:id` - Hủy booking

### Admin (Requires admin role)
- `GET /api/admin/users` - Lấy danh sách users
- `POST /api/admin/users` - Tạo user
- `PUT /api/admin/users/:id` - Cập nhật user
- `DELETE /api/admin/users/:id` - Xóa user
- `GET /api/admin/computers` - Quản lý máy
- `GET /api/admin/bookings` - Xem tất cả bookings
- `GET /api/admin/groups` - Quản lý nhóm
- `GET /api/admin/stats` - Thống kê

### Client API
- `POST /api/client/check-unlock` - Kiểm tra có nên mở khóa
- `POST /api/client/unlock` - Mở khóa máy
- `POST /api/client/lock` - Khóa máy

## 🔧 Production Deployment

### Backend
```bash
# Build and run
npm install --production
NODE_ENV=production npm start
```

### Frontend
```bash
cd client
npm run build
# Serve dist/ folder with nginx, apache, or any static server
```

### Client App
- Chạy như Windows Service (NSSM) hoặc Linux systemd service
- Xem hướng dẫn trong `client-app/README.md`

## 🔐 Security Notes

- Đổi `JWT_SECRET` trong production
- Sử dụng HTTPS trong production
- Cấu hình CORS đúng cách
- Giới hạn rate limiting cho API
- Chạy Client App với quyền administrator

## 🎨 Screenshots

### Giao diện Login
- Form đăng nhập với thiết kế gradient hiện đại
- Hỗ trợ đăng ký tài khoản mới

### Dashboard User
- Thống kê số máy đang sử dụng
- Hiển thị booking đang hoạt động
- Hướng dẫn sử dụng

### Đặt máy
- Grid view các máy tính
- Hiển thị trạng thái available/booked
- Modal chọn thời gian

### Admin Panel
- Dashboard thống kê
- Quản lý users, máy, bookings, nhóm
- Giao diện table với các action

## 📄 License

MIT License

## 👨‍💻 Author

Computer Booking System - 2024

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## ⭐ Show your support

Give a ⭐️ if this project helped you!

---

**Note:** Đây là phiên bản demo. Trong môi trường production thực tế, cần:
- Implement OS-specific lock/unlock commands
- Thêm logging và monitoring
- Setup database backup
- Cấu hình load balancing
- Thêm email notifications
- Implement WebSocket cho real-time updates


