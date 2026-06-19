

```markdown
# 📚 Dự án PrepAce - Nền tảng Học trực tuyến (E-Learning Platform)

Chào mừng bạn đã đến với dự án **PrepAce** (Mã nguồn: `thang-frontend`)! 

Mã nguồn ở nhánh này là bản nền tảng chuẩn bao gồm phân hệ Frontend (React/Vite) kết hợp với Mock Backend (`json-server`) chạy tách biệt trên hai cổng khác nhau. Tài liệu này hướng dẫn chi tiết từng bước từ cách tải code (Clone) từ nhánh của Vũ, tự rẽ nhánh khác để làm việc, cài đặt thư viện và khởi chạy hệ thống.

---

## 🛠️ Yêu cầu tiên quyết trước khi chạy
Trước khi bấm lệnh, đảm bảo máy tính của bạn đã cài đặt môi trường **Node.js** (Khuyến khích phiên bản 18 hoặc 20 trở lên). Nếu chưa có, hãy tải về và cài đặt bản LTS từ trang chủ Node.js.

---

## 🛑 Hướng dẫn quy trình sử dụng Git & GitHub (Lấy nền từ nhánh Vu ➔ Làm trên nhánh riêng)

Để đảm bảo bạn lấy đúng bản code nền tảng chuẩn nhất của Vũ nhưng không làm ảnh hưởng hay đè hỏng code gốc, hãy làm theo đúng quy trình rẽ nhánh này:

### Bước 1: Tải (Clone) duy nhất nhánh của Vũ về máy
Bạn mở Terminal (hoặc Git Bash) tại thư mục muốn lưu dự án trên máy tính và gõ chính xác lệnh sau:
```bash
git clone -b feature/update-frontend-Vu https://github.com/PrepAce-AI/thang-frontend.git

```



### Bước 2: Di chuyển vào thư mục và TỰ ĐỔI SANG NHÁNH KHÁC để làm

Ngay sau khi tải về xong, bạn bắt buộc phải di chuyển vào thư mục code và tạo một nhánh mới của riêng bạn. **Tuyệt đối không được viết code trực tiếp trên nhánh Vu**.

1. Di chuyển vào thư mục dự án vừa tải:
```bash
cd thang-frontend

```


2. Tạo và tự động chuyển sang nhánh mới tinh mang tên bạn (nhánh này sẽ sao chép toàn bộ nền tảng của nhánh Vu sang cho bạn phát triển tiếp):
```bash
git checkout -b <tên_nhánh_mới_của_bạn>

```


*(Ví dụ bạn tên An thì gõ: `git checkout -b feature/chuc-nang-An`)*

### Bước 3: Quy trình viết code và đẩy code lên GitHub hàng ngày

Sau khi bạn đã viết xong code, chạy thử trên trình duyệt thấy ổn định, hãy mở Terminal lên và làm theo đúng 4 bước sau để đẩy code lên mạng:

* **Xem các file đã chỉnh sửa:**
```bash
git status

```


* **Đóng gói toàn bộ các thay đổi:**
```bash
git add .

```


*(Lưu ý có dấu chấm ở cuối câu lệnh).*
* **Tạo lời nhắn/ghi chú chuẩn chỉnh cho lần cập nhật này:**
```bash
git commit -m "feat: Cấu hình dữ liệu giả lập và định tuyến phân quyền cơ bản"

```


* **Đẩy code lên nhánh riêng của bạn:**
```bash
git push origin HEAD

```


*(Lệnh `HEAD` sẽ tự động đẩy code lên đúng cái tên nhánh riêng mà bạn vừa tạo ở Bước 2, tuyệt đối an toàn và không bị đè vào nhánh gốc của Vũ).*

---

## 🚀 Hướng dẫn chi tiết các bước cài đặt và khởi chạy

Hệ thống này yêu cầu bạn phải **chạy song song 2 ô Terminal độc lập** . Hãy thực hiện tuần tự theo đúng các bước sau:

### Bước 1: Mở thư mục dự án bằng phần mềm VS Code

1. Mở phần mềm **Visual Studio Code (VS Code)** trên máy tính.
2. Trên thanh menu, chọn `File` ➔ Chọn `Open Folder`.
3. Tìm và chọn đúng thư mục dự án vừa clone về (`thang-frontend`).

### Bước 2: Mở Terminal và Cài đặt các thư viện (Dependencies)

1. Trên thanh công cụ phía trên cùng của VS Code, bấm vào chữ `Terminal` ➔ Chọn `New Terminal`.
2. Tại ô cửa sổ dòng lệnh vừa hiện ra dưới đáy màn hình, gõ câu lệnh sau và nhấn **Enter**:
```bash
npm install

```


*Bạn chờ khoảng vài chục giây cho đến khi hệ thống tải xong thư mục `node_modules`.*

### Bước 3: Khởi chạy Máy chủ dữ liệu 

1. Bạn dùng luôn ô Terminal vừa cài đặt xong thư viện ở Bước 2.
2. Copy chính xác toàn bộ câu lệnh dài dưới đây, dán vào Terminal và nhấn **Enter**:
```bash
npx json-server@0.17.4 --watch db.json --routes routes.json --port 5000

```


3. **Lưu ý:** Nếu Terminal hỏi `Need to install the following packages: json-server@0.17.4. Ok to proceed? (y)`, bạn hãy **gõ chữ `y` rồi nhấn Enter**.
* **Dấu hiệu thành công:** Màn hình hiện chữ `Loading db.json`, `Loading routes.json -> Done`.
* Server dữ liệu giả lập sẽ chạy cố định tại địa chỉ `http://localhost:5000`. **Giữ nguyên ô Terminal này, tuyệt đối không được tắt đi.**



### Bước 4: Mở Terminal thứ hai và Khởi chạy Giao diện (React Frontend)

1. Nhìn vào góc trên bên phải của ô Terminal đang chạy Backend, bạn sẽ thấy một biểu tượng **dấu cộng `+**` (*New Terminal*). Bấm vào dấu `+` đó để mở thêm một ô Terminal thứ hai chạy song song.
2. Tại ô Terminal mới tinh vừa hiện ra này, bạn gõ câu lệnh sau và nhấn **Enter**:
```bash
npm run dev

```


* Giao diện React/Vite sẽ được kích hoạt tại địa chỉ: `http://localhost:5173`. Bạn giữ phím `Ctrl` và click chuột vào đường link đó để mở trang web trên trình duyệt.



---

## 👥 Hướng dẫn thiết lập Local Storage để Test các Vai trò (Roles)

Hệ thống kiểm tra quyền (`role`) thông qua dữ liệu được lưu trong trình duyệt (`localStorage`). Khi test giao diện, bạn thực hiện gán quyền bằng tay theo các bước sau:

1. Mở trang web `http://localhost:5173` trên trình duyệt.
2. Nhấn phím **F12** (hoặc chuột phải chọn *Kiểm tra / Inspect*).
3. Chọn tab **Application** (đối với Chrome/Edge) hoặc tab **Storage** (đối với Firefox).
4. Ở danh mục bên trái, tìm mục **Local Storage** ➔ Kích chuột chọn dòng `http://localhost:5173`.
5. Điền thủ công các cặp Key - Value tương ứng với từng vai trò dưới đây vào bảng, sau đó **nhấn F5 (Hard Reload)** lại trang:

### 1. Phân hệ: Học sinh (STUDENT)

* **Các link dùng để test:** `/home`, `/courses`, `/course/1`, `/learn/1`
* **Nhập thông tin vào Local Storage:**
* Key: `token` — Ô Value nhập: `student-secret-token`
* Key: `user` — Ô Value nhập: `{"id": "1", "fullName": "Phạm Đức Anh", "role": "STUDENT"}`


* *Lưu ý:* Học sinh chỉ nhìn thấy các khóa học đã được Admin duyệt xuất bản (`"status": "PUBLISHED"` trong file `db.json`).

### 2. Phân hệ: Giáo viên (TEACHER)

* **Các link dùng để test:** `/teacher/dashboard`, `/teacher/course/new/edit`
* **Nhập thông tin vào Local Storage:** *(Bắt buộc phải giữ đúng ID bằng 2)*
* Key: `token` — Ô Value nhập: `teacher-secret-token`
* Key: `user` — Ô Value nhập: `{"id": "2", "fullName": "Nguyễn Minh Quân", "role": "TEACHER"}`


* *Lưu ý:* Trang quản lý của giáo viên chỉ lọc ra các khóa học có `teacher_id: 2`. Nếu điền sai ID, danh sách khóa học sẽ bị trống.

### 3. Phân hệ: Quản trị viên (ADMIN)

* **Các link dùng để test:** `/admin`, `/admin/courses`, `/admin/users`
* **Nhập thông tin vào Local Storage:**
* Key: `token` — Ô Value nhập: `admin-secret-token`
* Key: `user` — Ô Value nhập: `{"id": "99", "fullName": "Tổng Quản Trị", "role": "ADMIN"}`



---

## ⚠️ Nguyên tắc đồng bộ dữ liệu bắt buộc giữa các thành viên

1. **Tuyệt đối không đổi tên thuộc tính (Key):** Cấu trúc file `db.json` đã được làm sạch và thống nhất. Bạn phải dùng đúng tên key: `fullName` cho người dùng, `title` cho tên khóa học, và `teacher_name` cho tên giảng viên. Tự ý đổi chữ hoa/chữ thường hoặc viết tắt sẽ làm trắng giao diện.
2. **Không commit file rác:** File `.gitignore` đã được cấu hình sẵn để chặn thư mục nặng `node_modules/` và các file cấu hình bảo mật `.env`. Không tìm cách xóa file `.gitignore` để tránh đẩy dữ liệu rác lên GitHub làm nặng và treo mã nguồn chung của nhóm.

```

```

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
