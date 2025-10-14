# Computer Booking Client App

Ứng dụng client chạy trên máy tính để tự động mở khóa và khóa máy dựa trên lịch đặt.

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình file `.env`:
```env
SERVER_URL=http://localhost:3000
COMPUTER_ID=1
CHECK_INTERVAL=10
```

- `SERVER_URL`: URL của server API
- `COMPUTER_ID`: ID của máy tính (lấy từ admin panel)
- `CHECK_INTERVAL`: Thời gian kiểm tra (giây)

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## Chức năng

- ✅ Tự động kiểm tra booking từ server
- ✅ Mở khóa máy khi có booking hợp lệ
- ✅ Khóa máy khi hết thời gian booking
- ✅ Hiển thị thông tin booking và trạng thái
- ✅ Graceful shutdown

## Lưu ý

- Ứng dụng cần chạy với quyền administrator/sudo để có thể lock/unlock máy
- Trong bản demo, chỉ hiển thị log mô phỏng
- Trong production, cần implement OS-specific commands để thực sự lock/unlock máy

### Windows
```javascript
// Unlock (disable lock screen)
await execAsync('powershell -Command "Disable-ScreenSaver"');

// Lock workstation
await execAsync('rundll32.exe user32.dll,LockWorkStation');
```

### Linux
```bash
# Unlock
loginctl unlock-session

# Lock
loginctl lock-session
```

## Chạy như service

### Windows (với NSSM)
```bash
nssm install ComputerBookingClient "C:\path\to\node.exe" "C:\path\to\client-app\index.js"
nssm start ComputerBookingClient
```

### Linux (với systemd)
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

[Install]
WantedBy=multi-user.target
```

Sau đó:
```bash
sudo systemctl enable computer-booking-client
sudo systemctl start computer-booking-client
```


