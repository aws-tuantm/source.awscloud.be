# AWS Serverless & Cloud Backend Architecture Guide 🚀

Tài liệu này cung cấp thiết kế kiến trúc chuẩn mực, chi tiết các luồng xử lý (Workflows), sơ đồ dữ liệu và tích hợp các dịch vụ AWS cho hệ thống **AWS Cloud Events & RSVP Platform**.

---

## 📑 Mục lục
1. [Tổng quan Kiến trúc Hệ thống (System Overview)](#1-tổng-quan-kiến-trúc-hệ-thống)
2. [Sơ đồ Kiến trúc AWS Tổng thể (Mermaid Architecture)](#2-sơ-đồ-kiến-trúc-aws-tổng-thể)
3. [Cấu trúc Thư mục Module Backend](#3-cấu-trúc-thư-mục-module-backend)
4. [Chi tiết các Luồng xử lý AWS (AWS Workflows)](#4-chi-tiết-các-luồng-xử-lý-aws)
   - [4.1. Luồng Xác thực Người dùng (AWS Cognito)](#41-luồng-xác-thực-người-dùng-aws-cognito)
   - [4.2. Luồng Quản lý Sự kiện (Amazon RDS MySQL Multi-AZ)](#42-luồng-quản-lý-sự-kiện-amazon-rds-mysql-multi-az)
   - [4.3. Luồng Đăng ký RSVP & Lưu trữ NoSQL (Amazon DynamoDB)](#43-luồng-đăng-ký-rsvp--lưu-trữ-nosql-amazon-dynamodb)
   - [4.4. Luồng Tải ảnh Trực tiếp & Giới hạn 2MB (Amazon S3)](#44-luồng-tải-ảnh-trực-tiếp--giới-hạn-2mb-amazon-s3)
   - [4.5. Luồng Gửi Email Xác nhận & Hàng loạt (Amazon SES)](#45-luồng-gửi-email-xác-nhận--hàng-loạt-amazon-ses)
5. [Thiết kế Dữ liệu (Database Schema Design)](#5-thiết-kế-dữ-liệu-database-schema-design)
6. [Bảng biến môi trường (.env Reference)](#6-bảng-biến-môi-trường-env-reference)

---

## 1. Tổng quan Kiến trúc Hệ thống

Hệ thống kết hợp mô hình **Serverless & Microservices-ready**, tận dụng tối đa sức mạnh của hệ sinh thái AWS:
- **Compute:** AWS Lambda (Deploy production) / Express Node.js (Local development & microservice container).
- **Authentication:** AWS Cognito User Pool with Email Verification & SRP / USER_PASSWORD_AUTH.
- **Relational DB:** Amazon RDS MySQL (Lưu trữ Metadata sự kiện, quản lý quan hệ CRUD).
- **NoSQL DB:** Amazon DynamoDB (Single-table design tối ưu tốc độ ghi RSVP, Realtime Attendee Stats với TransactWriteItems).
- **Object Storage:** Amazon Simple Storage Service (S3) `tuantm-assets-bucket` (Lưu trữ Banner sự kiện và Avatar người tham gia, giới hạn 2MB).
- **Email Service:** Amazon Simple Email Service (SES) (Gửi email giao dịch HTML chuẩn responsive tới người tham dự).

---

## 2. Sơ đồ Kiến trúc AWS Tổng thể

```mermaid
graph TD
    Client["React Web Application (Vite + Tailwind)"] -->|HTTPS / REST API| APIGateway["Amazon API Gateway / Express App"]

    subgraph AWS_Security_Auth ["AWS Security & Auth"]
        APIGateway -->|Xác thực Token & Đăng nhập| Cognito["Amazon Cognito User Pool"]
    end

    subgraph AWS_Storage_DB ["AWS Storage & DB"]
        APIGateway -->|CRUD Sự kiện| RDS[("Amazon RDS MySQL (events)")]
        APIGateway -->|TransactWrite RSVP & Query| DynamoDB[("Amazon DynamoDB (RSVPTable)")]
        APIGateway -->|Upload Banner & Avatar - Tối đa 2MB| S3["Amazon S3 (tuantm-assets-bucket)"]
    end

    subgraph AWS_Notifications ["AWS Notifications"]
        APIGateway -->|Gửi Email Template Xác nhận| SES["Amazon Simple Email Service (SES)"]
        SES -->|Gửi thư tới Inbox| Attendees["Người tham dự (Attendees)"]
    end
```

---

## 3. Cấu trúc Thư mục Module Backend

```
source.awscloud.be/
├── src/
│   ├── config/
│   │   ├── aws.js              # Khởi tạo SDK Clients (S3, DynamoDB, SES, Cognito)
│   │   └── db.js               # Khởi tạo Connection Pool MySQL RDS
│   ├── controllers/
│   │   ├── authController.js   # Điều hướng Đăng ký, OTP, Đăng nhập Cognito
│   │   ├── emailController.js  # Điều hướng gửi Email qua SES
│   │   ├── eventController.js  # Điều hướng CRUD Sự kiện MySQL
│   │   ├── rsvpController.js   # Điều hướng Đăng ký RSVP DynamoDB & Thống kê
│   │   └── uploadController.js # Điều hướng Upload File ảnh trực tiếp S3
│   ├── routes/
│   │   ├── authRoutes.js       # /auth/signup, /auth/confirm-signup, /auth/login
│   │   ├── emailRoutes.js      # /send-email
│   │   ├── eventRoutes.js      # /events (GET, POST, PUT, DELETE)
│   │   ├── rsvpRoutes.js       # /rsvp, /attendees/:eventId, /stats/:eventId
│   │   └── uploadRoutes.js     # /upload, /upload-url
│   ├── services/
│   │   ├── cognitoService.js   # Nghiệp vụ AWS Cognito Identity Provider
│   │   ├── eventService.js     # Nghiệp vụ truy vấn MySQL RDS
│   │   ├── rsvpService.js      # Nghiệp vụ DynamoDB Transaction & Query
│   │   ├── s3Service.js        # Nghiệp vụ Upload Buffer & Presigned URL S3
│   │   └── sesService.js       # Nghiệp vụ gửi Email đơn lẻ & hàng loạt SES
│   ├── utils/
│   │   ├── emailTemplate.js    # Tạo HTML Template chuyên nghiệp cho SES
│   │   └── validators.js       # RFC Email Regex, Giới hạn ảnh 2MB & định dạng
│   └── app.js                  # Express App Config, CORS & Middleware
├── .env                        # Biến môi trường AWS & Database
├── local.js                    # Server Local Express Runner (node --watch local.js)
├── index.js                    # AWS Lambda Handler entrypoint
└── package.json
```

---

## 4. Chi tiết các Luồng xử lý AWS

### 4.1. Luồng Xác thực Người dùng (AWS Cognito)
```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant App as React Client
    participant AuthCtrl as authController
    participant Cognito as AWS Cognito
    participant SES as Amazon SES

    User->>App: Nhập Email & Mật khẩu (Validation checklist)
    App->>AuthCtrl: POST /auth/signup
    AuthCtrl->>Cognito: SignUpCommand(email, password, name)
    Cognito->>SES: Tự động gửi mã OTP 6 số về Email
    SES-->>User: Nhận Email chứa OTP
    User->>App: Nhập mã OTP 6 số
    App->>AuthCtrl: POST /auth/confirm-signup
    AuthCtrl->>Cognito: ConfirmSignUpCommand(email, code)
    Cognito-->>App: Xác thực thành công
    User->>App: Bấm Đăng nhập
    App->>AuthCtrl: POST /auth/login
    AuthCtrl->>Cognito: InitiateAuthCommand (USER_PASSWORD_AUTH)
    Cognito-->>App: Trả về AccessToken, IdToken, RefreshToken
```

---

### 4.2. Luồng Quản lý Sự kiện (Amazon RDS MySQL Multi-AZ)
- Bảng `events` lưu trữ cấu trúc quan hệ chuẩn: `event_id`, `title`, `description`, `venue`, `start_at`, `banner_url`.
- Sử dụng `mysql2/promise` connection pool tối đa 10 kết nối đồng thời.
- CRUD API:
  - `GET /events`: Liệt kê tất cả sự kiện sắp xếp theo ngày bắt đầu.
  - `POST /events`: Tạo sự kiện mới.
  - `PUT /events/:eventId`: Cập nhật thông tin sự kiện.
  - `DELETE /events/:eventId`: Xóa sự kiện vĩnh viễn.

---

### 4.3. Luồng Đăng ký RSVP & Lưu trữ NoSQL (Amazon DynamoDB)
```mermaid
sequenceDiagram
    autonumber
    actor User as Người tham gia
    participant App as React Client
    participant RSVPCtrl as rsvpController
    participant S3 as Amazon S3
    participant Dynamo as Amazon DynamoDB
    participant SES as Amazon SES

    User->>App: Điền Form (Họ tên, Email, Trạng thái, Avatar File)
    App->>RSVPCtrl: POST /rsvp (Multipart Form-Data)
    opt Có Avatar đính kèm
        RSVPCtrl->>S3: PutObjectCommand (tuantm-assets-bucket)
        S3-->>RSVPCtrl: Trả về S3 URL công khai
    end
    RSVPCtrl->>Dynamo: TransactWriteItemsCommand (Put Item & Update Counter)
    RSVPCtrl->>SES: sendRsvpConfirmationEmail (Bất đồng bộ)
    SES-->>User: Gửi email xác nhận HTML đẹp
    RSVPCtrl-->>App: Trả về kết quả 200 OK
```

---

### 4.4. Luồng Tải ảnh Trực tiếp & Giới hạn 2MB (Amazon S3)
- **Ràng buộc kích thước:** `MAX_IMAGE_SIZE = 2 * 1024 * 1024` (Tối đa 2MB).
- **Định dạng cho phép:** `image/jpeg`, `image/jpg`, `image/png`, `image/webp`.
- **Target Bucket:** `tuantm-assets-bucket` (Region `ap-southeast-1`).
- Đặt tên file an toàn: `uploads/{timestamp}-{sanitizedFileName}`.

---

### 4.5. Luồng Gửi Email Xác nhận & Hàng loạt (Amazon SES)
- **Sender Identity:** `devblue404@gmail.com` (Đã verify trên Amazon SES).
- **Tính năng Gửi hàng loạt (Bulk Email):**
  - Chấp nhận danh sách email dạng Chip từ Frontend.
  - Tự động lấy danh sách người tham gia có trạng thái `Yes` từ DynamoDB GSI.
  - Template HTML tương thích tốt với Gmail, Outlook, Apple Mail trên cả Desktop và Mobile.

---

## 5. Thiết kế Dữ liệu (Database Schema Design)

### 5.1. MySQL RDS Schema (`events`)
```sql
CREATE TABLE IF NOT EXISTS events (
  event_id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  venue VARCHAR(255),
  start_at DATETIME NOT NULL,
  banner_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2. DynamoDB Single-Table Design (`ServerlessRsvpPlatform-prod-RSVPTable`)
| PK (String) | SK (String) | GSI1PK (String) | GSI1SK (String) | Attributes |
|---|---|---|---|---|
| `EVENT#<event_id>` | `USER#<email>` | `EVENT#<event_id>` | `STATUS#Yes` / `STATUS#No` | `full_name`, `response`, `avatar_url`, `timestamp` |
| `EVENT#<event_id>` | `METADATA` | - | - | `yes_count` (N), `no_count` (N) |

---

## 6. Bảng biến môi trường mẫu (.env Reference)

Bảng dưới đây là cấu hình các biến môi trường mẫu để thiết lập dự án:

| Tên biến | Giá trị mẫu (Ví dụ) | Mục đích |
|---|---|---|
| `PORT` | `3000` | Cổng chạy Express Server Local |
| `REGION` | `ap-southeast-1` | AWS Region triển khai (VD: `ap-southeast-1`, `us-east-1`) |
| `S3_BUCKET_NAME` | `my-aws-event-assets-bucket` | AWS S3 Bucket lưu trữ ảnh sự kiện & avatar (<= 2MB) |
| `AWS_ACCESS_KEY_ID` | `AKIAIOSFODNN7EXAMPLE` | Access Key IAM User xác thực quyền AWS |
| `AWS_SECRET_ACCESS_KEY` | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | Secret Access Key IAM User |
| `AWS_SESSION_TOKEN` | *(Để trống nếu dùng permanent IAM key)* | Session token khi dùng tạm thời qua AWS STS |
| `SES_SENDER_EMAIL` | `noreply-events@yourdomain.com` | Email người gửi đã được Verified Identity trên Amazon SES |
| `COGNITO_USER_POOL_ID` | `ap-southeast-1_xxxxxxxxx` | User Pool ID dịch vụ xác thực Amazon Cognito |
| `COGNITO_CLIENT_ID` | `xxxxxxxxxxxxxxxxxxxxxxxxxx` | App Client ID xác thực người dùng trong Cognito |
| `TABLE_NAME` | `ServerlessRsvpPlatform-prod-RSVPTable` | Bảng Amazon DynamoDB lưu trữ danh sách RSVP & đếm số lượng |
| `DB_HOST` | `your-rds-instance.xxxxxx.ap-southeast-1.rds.amazonaws.com` | Endpoint máy chủ Amazon RDS MySQL Multi-AZ |
| `DB_USER` | `admin` | Tài khoản quản trị cơ sở dữ liệu MySQL |
| `DB_PASS` | `YourSecurePassword123!` | Mật khẩu truy cập cơ sở dữ liệu MySQL |
| `DB_NAME` | `eventsdb` | Tên cơ sở dữ liệu MySQL lưu trữ thông tin sự kiện |

