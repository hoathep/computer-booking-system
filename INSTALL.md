# 📦 Hướng dẫn cài đặt chi tiết

## Yêu cầu hệ thống

- Node.js >= 18.0.0
- npm >= 9.0.0
- Windows/Linux/MacOS

## Bước 1: Cài đặt Node.js

### Windows
1. Download Node.js từ https://nodejs.org/
2. Chạy installer và làm theo hướng dẫn
3. Kiểm tra cài đặt:
```bash
node --version
npm --version
```

### Linux (Ubuntu/Debian)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### MacOS
```bash
brew install node
```

## Bước 2: Clone và cài đặt project

```bash
# Clone project (hoặc extract từ zip)
cd computer-booking-system

# Cài đặt backend dependencies
npm install

# Cài đặt frontend dependencies
cd client
npm install
cd ..

# Cài đặt client app dependencies
cd client-app
npm install
cd ..
```

## Bước 3: Cấu hình

### Backend (Tùy chọn)
File `.env` đã có sẵn, bạn có thể giữ nguyên hoặc thay đổi:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

### Client App (Bắt buộc)
Tạo file `.env` trong thư mục `client-app/`:
```env
SERVER_URL=http://localhost:3000
COMPUTER_ID=1
CHECK_INTERVAL=10
```

**Lưu ý:** 
- `COMPUTER_ID` phải khớp với ID máy trong database
- Để xem ID máy, đăng nhập admin và vào "Quản lý Máy"

## Bước 4: Chạy ứng dụng

### Cách 1: Chạy toàn bộ (Khuyến nghị cho development)
```bash
npm run dev
```

Điều này sẽ khởi động:
- Backend API tại http://localhost:3000
- Frontend tại http://localhost:5173

### Cách 2: Chạy từng phần

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

**Terminal 3 - Client App (trên máy cần mở khóa):**
```bash
cd client-app
npm start
```

## Bước 5: Truy cập ứng dụng

1. Mở trình duyệt: http://localhost:5173
2. Đăng nhập với:
   - **Admin:** username: `admin` / password: `admin123`
   - **User:** Đăng ký tài khoản mới

## Bước 6: Thiết lập dữ liệu

1. **Đăng nhập Admin**
2. **Thêm máy tính** (nếu cần):
   - Vào "Quản lý Máy"
   - Click "Thêm Máy"
   - Nhập thông tin và IP/MAC address
3. **Tạo users** (nếu cần):
   - Vào "Quản lý Users"
   - Click "Thêm User"
4. **Tạo nhóm và đặt giới hạn**:
   - Vào "Quản lý Nhóm"
   - Tạo nhóm mới với giới hạn booking

## Bước 7: Cài đặt Client App trên máy tính

### Cài đặt thủ công
1. Copy thư mục `client-app` sang máy tính đích
2. Cấu hình `.env` với đúng `COMPUTER_ID`
3. Chạy: `npm start`

### Cài đặt như Windows Service (Production)

**Sử dụng NSSM:**
```bash
# Download NSSM từ https://nssm.cc/download

# Cài đặt service
nssm install ComputerBookingClient "C:\Program Files\nodejs\node.exe" "C:\path\to\client-app\index.js"

# Đặt thư mục làm việc
nssm set ComputerBookingClient AppDirectory "C:\path\to\client-app"

# Start service
nssm start ComputerBookingClient
```

### Cài đặt như Linux Service (Production)

Tạo file `/etc/systemd/system/computer-booking-client.service`:
```ini
[Unit]
Description=Computer Booking Client
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/path/to/client-app
ExecStart=/usr/bin/node index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable và start:
```bash
sudo systemctl enable computer-booking-client
sudo systemctl start computer-booking-client
sudo systemctl status computer-booking-client
```

## Xử lý sự cố

### Lỗi: npm không được nhận diện
**Giải pháp:** Cài đặt lại Node.js hoặc thêm Node.js vào PATH

### Lỗi: Port 3000 đã được sử dụng
**Giải pháp:** Thay đổi PORT trong file `.env` (backend)

### Lỗi: Cannot connect to server (Client App)
**Giải pháp:** 
- Kiểm tra backend đang chạy
- Kiểm tra `SERVER_URL` trong `.env` của client-app

### Lỗi: COMPUTER_ID không tồn tại
**Giải pháp:**
- Đăng nhập admin
- Vào "Quản lý Máy" để xem ID máy
- Cập nhật `COMPUTER_ID` trong `.env` của client-app

### Lỗi: Database is locked
**Giải pháp:**
- Đóng tất cả các process đang truy cập database
- Restart server

## Tips

1. **Development:**
   - Sử dụng `npm run dev` để hot-reload
   - Mở DevTools để debug

2. **Production:**
   - Build frontend: `cd client && npm run build`
   - Chạy backend với PM2: `pm2 start server/index.js`
   - Serve frontend build với nginx

3. **Testing:**
   - Tạo nhiều user để test giới hạn booking
   - Test trên nhiều máy với client-app

## Liên hệ hỗ trợ

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra logs trong console
2. Đọc lại hướng dẫn
3. Tạo issue trên GitHub (nếu có)

---

**Chúc bạn cài đặt thành công! 🎉**


