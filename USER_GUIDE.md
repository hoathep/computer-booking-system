# 📖 Hướng dẫn sử dụng Computer Booking System

## 👤 Hướng dẫn cho User

### 🏠 **Trang chủ Dashboard**

#### 📊 **Thông tin tổng quan**
- **Lịch đang đặt:** Số lượng máy đang được đặt
- **Tổng lịch đã đặt:** Tổng số lịch đã đặt trong hệ thống
- **Giới hạn máy:** Số máy tối đa có thể đặt cùng lúc

#### 📅 **Lịch đang đặt**
- Xem danh sách máy đã đặt với thời gian chi tiết
- Hiển thị mật khẩu đăng nhập cho mỗi máy
- Trạng thái: "Đã book" (đã xác nhận)
- Có thể cuộn để xem tất cả lịch đặt

#### 🔥 **Máy hot**
- Xem danh sách máy được đặt nhiều nhất
- **Nút "Hot":** Sắp xếp theo số lượng đặt (nhiều nhất)
- **Nút "Rảnh":** Sắp xếp theo trạng thái sẵn sàng
- Hiển thị đánh giá sao và số lượt đặt
- Có thể cuộn để xem tất cả máy

### 🖥️ **Đặt máy tính**

#### 📋 **Chọn máy**
1. **Danh sách máy bên trái:**
   - Tên máy ở dòng trên
   - Trạng thái ở dòng dưới
   - Hover để xem thông tin chi tiết (vị trí, IP, bộ nhớ, mô tả)
   - Màu sắc icon theo trạng thái:
     - 🟢 Xanh: Có sẵn
     - 🔵 Xanh dương: Sẵn sàng một phần
     - 🟡 Vàng: Đã book
     - 🔴 Đỏ: Đang sử dụng
     - 🟠 Cam: Bảo trì
     - ⚫ Xám: Vô hiệu hóa

2. **Trạng thái máy:**
   - **Có sẵn:** Máy trống, có thể đặt
   - **Sẵn sàng một phần:** Một số giờ đã được đặt
   - **Đã book full:** Đã đặt kín giờ hành chính (8h-17h)
   - **Đang sử dụng:** Máy đang được sử dụng
   - **Bảo trì:** Máy đang bảo trì (không thể đặt)
   - **Vô hiệu hóa:** Máy bị tắt (không thể đặt)

#### ⏰ **Chọn thời gian**
1. **Timeline bên phải:**
   - Hiển thị 24 giờ (0h-23h)
   - Mỗi khung = 30 phút
   - Click để chọn khung thời gian

2. **Màu sắc khung thời gian:**
   - ⚪ Xám: Có thể đặt
   - 🟢 Xanh: Đã chọn
   - 🔴 Đỏ: Đã được đặt bởi người khác
   - 🟡 Vàng: Giờ hiện tại

3. **Chọn nhiều khung:**
   - Click từng khung để chọn
   - Có thể chọn nhiều khung liên tiếp
   - Hệ thống tự động kiểm tra xung đột

#### ✅ **Xác nhận đặt máy**
1. **Thông tin đặt máy:**
   - Tên máy đã chọn
   - Thời gian bắt đầu và kết thúc
   - Tổng số giờ đặt
   - Mật khẩu đăng nhập (tự động tạo)

2. **Nhấn "Đặt máy":**
   - Hệ thống kiểm tra xung đột
   - Tạo booking mới
   - Gửi email mật khẩu đăng nhập
   - Hiển thị thông báo thành công

### 📅 **Quản lý lịch đặt**

#### 📋 **Xem lịch đã đặt**
- Vào "Lịch của tôi" để xem tất cả lịch
- Hiển thị thông tin chi tiết:
  - Tên máy và vị trí
  - Thời gian bắt đầu/kết thúc
  - Địa chỉ IP
  - Mật khẩu đăng nhập
  - Trạng thái booking

#### ❌ **Hủy lịch đặt**
- Click nút "Hủy" (icon thùng rác)
- Chỉ được hủy trước giờ bắt đầu
- Hệ thống sẽ gửi email xác nhận

#### ⭐ **Đánh giá máy**
- Sau khi sử dụng xong, có thể đánh giá máy
- Đánh giá từ 1-5 sao
- Có thể thay đổi đánh giá trong 5 ngày
- Đánh giá ảnh hưởng đến "Máy hot"

### ⚙️ **Cài đặt cá nhân**

#### 🔐 **Đổi mật khẩu**
- Click "Đổi mật khẩu" trên menu
- Nhập mật khẩu hiện tại
- Nhập mật khẩu mới
- Xác nhận thay đổi

#### 🌐 **Chuyển ngôn ngữ**
- Click biểu tượng cờ trên menu
- Chọn ngôn ngữ: Tiếng Việt, English, 日本語
- Giao diện sẽ chuyển đổi ngay lập tức

#### 🌙 **Chuyển giao diện**
- Click biểu tượng mặt trời/mặt trăng
- Chuyển đổi giữa giao diện sáng/tối
- Tùy chọn được lưu tự động

## 👨‍💼 Hướng dẫn cho Admin

### 🏠 **Dashboard Admin**

#### 📊 **Thống kê tổng quan**
- **Tổng số user:** Số lượng người dùng trong hệ thống
- **Tổng số máy:** Số lượng máy tính
- **Tổng số booking:** Tổng lịch đặt
- **Tổng số nhóm:** Số nhóm người dùng

#### 📈 **Biểu đồ thời gian**
- Thống kê booking theo thời gian
- Chọn khoảng thời gian: Ngày/Tuần/Tháng/Năm
- Xem xu hướng đặt máy
- Phân tích theo User/Group/Computer

#### 📊 **Xuất báo cáo**
- Click "Export" để tải file Excel
- Báo cáo tổng hợp với dữ liệu chi tiết
- Bao gồm thống kê theo thời gian

### 👥 **Quản lý User**

#### ➕ **Thêm user mới**
1. Vào "System Setting" → "Users"
2. Click "Thêm user"
3. Điền thông tin:
   - Họ tên
   - Username (duy nhất)
   - Email
   - Password
   - Nhóm (nếu có)
4. Đặt giới hạn booking
5. Click "Lưu"

#### ✏️ **Chỉnh sửa user**
- Click vào user cần sửa
- Thay đổi thông tin
- Cập nhật giới hạn booking
- Lưu thay đổi

#### 🗑️ **Xóa user**
- Click nút "Xóa" bên cạnh user
- Xác nhận xóa
- Lưu ý: Không thể xóa user đang có booking

### 👥 **Quản lý nhóm**

#### ➕ **Thêm nhóm mới**
1. Vào "System Setting" → "Groups"
2. Click "Thêm nhóm"
3. Điền tên nhóm
4. Đặt giới hạn booking cho nhóm
5. Lưu nhóm

#### 📁 **Import/Export nhóm**
- **Import:** Tải file CSV với danh sách nhóm
- **Export:** Xuất danh sách nhóm ra file CSV
- Format CSV: Tên nhóm, Giới hạn booking

### 🖥️ **Quản lý máy tính**

#### ➕ **Thêm máy mới**
1. Vào "System Setting" → "Computers"
2. Click "Thêm máy"
3. Điền thông tin:
   - Tên máy
   - Vị trí
   - IP Address
   - Bộ nhớ (GB)
   - Mô tả
   - Nhóm ưu tiên
4. Chọn trạng thái ban đầu
5. Lưu máy

#### 🔧 **Cập nhật trạng thái máy**
- **Available:** Máy có thể đặt
- **Maintenance:** Máy đang bảo trì (không thể đặt)
- **Disabled:** Máy bị vô hiệu hóa (không thể đặt)

#### ✏️ **Chỉnh sửa thông tin máy**
- Click vào máy cần sửa
- Cập nhật thông tin
- Lưu thay đổi

### 📊 **Báo cáo và thống kê**

#### 📈 **Báo cáo tổng hợp**
1. Vào "Report" → "Báo cáo tổng hợp"
2. Chọn khoảng thời gian
3. Xem thống kê theo:
   - User
   - Group
   - Computer
4. Xuất file Excel

#### 📊 **Biểu đồ thời gian**
- Chọn khoảng thời gian: Ngày/Tuần/Tháng/Năm
- Xem xu hướng booking
- Phân tích hiệu suất sử dụng

### ⚙️ **Cài đặt hệ thống**

#### 📧 **Cài đặt Email Server**
1. Vào "System Setting" → "Email Server"
2. Cấu hình SMTP:
   - Host: smtp.gmail.com
   - Port: 587
   - Secure: false
   - Auth User: email@gmail.com
   - Auth Password: app password
   - From Email: email@gmail.com
3. Test kết nối
4. Lưu cài đặt

#### 🏢 **Cài đặt Footer**
1. Vào "System Setting" → "Footer Settings"
2. Thiết lập thông tin:
   - Email hỗ trợ kỹ thuật
   - Số điện thoại
   - Link Microsoft Teams
3. Lưu cài đặt

#### 🌐 **Quản lý ngôn ngữ**
1. Vào "System Setting" → "Translations"
2. Chọn ngôn ngữ cần chỉnh sửa
3. Cập nhật các nhãn hiển thị
4. Thêm nhãn mới nếu cần
5. Lưu thay đổi

### 🔧 **Tính năng nâng cao**

#### 📊 **Hot Computers**
- Máy được đặt nhiều nhất hiển thị ở Dashboard
- Sắp xếp theo số lượng booking
- Hiển thị đánh giá sao trung bình
- Có thể sắp xếp theo "Hot" hoặc "Available"

#### ⭐ **Hệ thống đánh giá**
- User có thể đánh giá máy sau khi sử dụng
- Đánh giá từ 1-5 sao
- Có thể thay đổi đánh giá trong 5 ngày
- Đánh giá ảnh hưởng đến "Hot Computers"

#### 📧 **Email tự động**
- Gửi mật khẩu đăng nhập khi đặt máy
- Cấu hình SMTP để gửi email
- Email bao gồm thông tin booking chi tiết

#### 🎨 **Giao diện**
- Hỗ trợ chuyển đổi sáng/tối
- Responsive design
- Đa ngôn ngữ (Vi/En/Ja)
- Giao diện hiện đại với Tailwind CSS
