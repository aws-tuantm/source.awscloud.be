export const swaggerDocument = {
  "openapi": "3.0.3",
  "info": {
    "title": "AWS Cloud Event & RSVP Management API",
    "description": "API Documentation cho Hệ thống Quản lý Sự kiện và Đăng ký Serverless trên nền tảng AWS Cloud (Cognito, RDS MySQL, DynamoDB, S3, SES, API Gateway & Lambda).",
    "version": "1.0.0",
    "contact": {
      "name": "AWS Cloud Team"
    }
  },
  "servers": [
    {
      "url": "http://localhost:3000",
      "description": "Local Development Server"
    },
    {
      "url": "https://yba8kgabs7.execute-api.ap-southeast-1.amazonaws.com",
      "description": "AWS API Gateway Production Environment"
    }
  ],
  "tags": [
    {
      "name": "Auth (Cognito)",
      "description": "Xác thực và phân quyền người dùng qua Amazon Cognito User Pools"
    },
    {
      "name": "Events (RDS MySQL)",
      "description": "Quản lý thông tin sự kiện trong cơ sở dữ liệu quan hệ RDS MySQL"
    },
    {
      "name": "RSVP & Attendees (DynamoDB)",
      "description": "Đăng ký tham gia và thống kê phản hồi thời gian thực trên DynamoDB"
    },
    {
      "name": "Media & S3 Upload",
      "description": "Tải lên ảnh bìa sự kiện và ảnh đại diện người tham gia lên Amazon S3"
    },
    {
      "name": "Email Notification (SES)",
      "description": "Gửi email thông báo và vé xác nhận tham gia qua Amazon SES"
    },
    {
      "name": "System",
      "description": "Kiểm tra trạng thái máy chủ"
    }
  ],
  "paths": {
    "/health": {
      "get": {
        "tags": ["System"],
        "summary": "Health Check",
        "description": "Kiểm tra trạng thái hoạt động của Server/Lambda.",
        "responses": {
          "200": {
            "description": "Hệ thống hoạt động bình thường",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "status": { "type": "string", "example": "ok" },
                    "timestamp": { "type": "string", "format": "date-time" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/auth/signup": {
      "post": {
        "tags": ["Auth (Cognito)"],
        "summary": "Đăng ký tài khoản mới",
        "description": "Tạo tài khoản người dùng trên Amazon Cognito User Pool và tự động gửi mã OTP xác thực qua email.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string", "format": "email", "example": "user@domain.com" },
                  "password": { "type": "string", "format": "password", "minLength": 8, "example": "User@123456" },
                  "name": { "type": "string", "example": "Nguyễn Văn A" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đăng ký thành công, chờ xác thực OTP",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "userSub": { "type": "string" },
                    "isConfirmed": { "type": "boolean", "example": false }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Dữ liệu không hợp lệ hoặc Email đã tồn tại"
          }
        }
      }
    },
    "/auth/confirm-signup": {
      "post": {
        "tags": ["Auth (Cognito)"],
        "summary": "Xác thực tài khoản bằng mã OTP",
        "description": "Gửi mã OTP 6 chữ số nhận qua email để kích hoạt tài khoản.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "code"],
                "properties": {
                  "email": { "type": "string", "format": "email", "example": "user@domain.com" },
                  "code": { "type": "string", "pattern": "^\\d{6}$", "example": "123456" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Kích hoạt tài khoản thành công"
          },
          "400": {
            "description": "Mã OTP sai hoặc đã hết hạn"
          }
        }
      }
    },
    "/auth/login": {
      "post": {
        "tags": ["Auth (Cognito)"],
        "summary": "Đăng nhập",
        "description": "Xác thực email/mật khẩu và nhận về bộ JWT Tokens (AccessToken, IdToken, RefreshToken).",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": { "type": "string", "format": "email", "example": "user@domain.com" },
                  "password": { "type": "string", "format": "password", "example": "User@123456" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đăng nhập thành công",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "accessToken": { "type": "string" },
                    "idToken": { "type": "string" },
                    "refreshToken": { "type": "string" },
                    "expiresIn": { "type": "number", "example": 3600 },
                    "tokenType": { "type": "string", "example": "Bearer" }
                  }
                }
              }
            }
          },
          "400": {
            "description": "Sai tài khoản hoặc mật khẩu"
          }
        }
      }
    },
    "/auth/resend-code": {
      "post": {
        "tags": ["Auth (Cognito)"],
        "summary": "Gửi lại mã OTP xác thực",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email"],
                "properties": {
                  "email": { "type": "string", "format": "email", "example": "user@domain.com" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đã gửi lại mã OTP mới"
          }
        }
      }
    },
    "/events": {
      "get": {
        "tags": ["Events (RDS MySQL)"],
        "summary": "Lấy danh sách tất cả sự kiện",
        "responses": {
          "200": {
            "description": "Danh sách các sự kiện",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/Event" }
                }
              }
            }
          }
        }
      },
      "post": {
        "tags": ["Events (RDS MySQL)"],
        "summary": "Tạo sự kiện mới",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["title"],
                "properties": {
                  "event_id": { "type": "string", "example": "aws-cloud-day-2026" },
                  "title": { "type": "string", "example": "AWS Cloud Practitioner Workshop 2026" },
                  "description": { "type": "string", "example": "Hội thảo chuyên sâu về kiến trúc Serverless trên AWS." },
                  "start_at": { "type": "string", "format": "date-time", "example": "2026-10-15T09:00:00Z" },
                  "venue": { "type": "string", "example": "Hall A, Innovation Center & Online" },
                  "banner_url": { "type": "string", "example": "https://tuantm-assets-bucket.s3.ap-southeast-1.amazonaws.com/uploads/banner.png" }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Tạo sự kiện thành công"
          },
          "400": {
            "description": "Thiếu trường bắt buộc"
          }
        }
      }
    },
    "/events/{event_id}": {
      "get": {
        "tags": ["Events (RDS MySQL)"],
        "summary": "Lấy chi tiết sự kiện theo ID",
        "parameters": [
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Thông tin chi tiết sự kiện",
            "content": {
              "application/json": {
                "schema": { "$ref": "#/components/schemas/Event" }
              }
            }
          },
          "404": { "description": "Không tìm thấy sự kiện" }
        }
      },
      "put": {
        "tags": ["Events (RDS MySQL)"],
        "summary": "Cập nhật thông tin sự kiện",
        "parameters": [
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "title": { "type": "string" },
                  "description": { "type": "string" },
                  "start_at": { "type": "string", "format": "date-time" },
                  "venue": { "type": "string" },
                  "banner_url": { "type": "string" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Cập nhật thành công" }
        }
      },
      "delete": {
        "tags": ["Events (RDS MySQL)"],
        "summary": "Xóa sự kiện",
        "parameters": [
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": { "description": "Đã xóa sự kiện thành công" }
        }
      }
    },
    "/rsvp": {
      "post": {
        "tags": ["RSVP & Attendees (DynamoDB)"],
        "summary": "Đăng ký tham gia sự kiện (RSVP)",
        "description": "Ghi nhận phản hồi tham gia vào bảng DynamoDB `event-rsvp-responses` bằng TransactWriteItems.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["event_id", "full_name", "email", "response"],
                "properties": {
                  "event_id": { "type": "string", "example": "aws-cloud-day-2026" },
                  "full_name": { "type": "string", "example": "Trần Minh Tuấn" },
                  "email": { "type": "string", "format": "email", "example": "tuan@example.com" },
                  "response": { "type": "string", "enum": ["Yes", "No"], "example": "Yes" },
                  "avatar_url": { "type": "string", "example": "https://tuantm-assets-bucket.s3.ap-southeast-1.amazonaws.com/uploads/avatar.png" }
                }
              }
            },
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "required": ["event_id", "full_name", "email", "response"],
                "properties": {
                  "event_id": { "type": "string" },
                  "full_name": { "type": "string" },
                  "email": { "type": "string" },
                  "response": { "type": "string", "enum": ["Yes", "No"] },
                  "avatar": { "type": "string", "format": "binary" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Đăng ký RSVP thành công"
          },
          "409": {
            "description": "Email này đã đăng ký sự kiện trước đó rồi"
          }
        }
      }
    },
    "/attendees/{event_id}": {
      "get": {
        "tags": ["RSVP & Attendees (DynamoDB)"],
        "summary": "Lấy danh sách người đã đăng ký theo sự kiện",
        "parameters": [
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          },
          {
            "name": "response",
            "in": "query",
            "required": false,
            "schema": { "type": "string", "enum": ["Yes", "No"] },
            "description": "Lọc theo trạng thái tham gia"
          }
        ],
        "responses": {
          "200": {
            "description": "Danh sách người đăng ký từ DynamoDB",
            "content": {
              "application/json": {
                "schema": {
                  "type": "array",
                  "items": { "$ref": "#/components/schemas/Attendee" }
                }
              }
            }
          }
        }
      }
    },
    "/stats/{event_id}": {
      "get": {
        "tags": ["RSVP & Attendees (DynamoDB)"],
        "summary": "Lấy thống kê số lượng phản hồi (Yes/No)",
        "parameters": [
          {
            "name": "event_id",
            "in": "path",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Số lượng phản hồi tham gia",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "Yes": { "type": "integer", "example": 45 },
                    "No": { "type": "integer", "example": 8 }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/upload-url": {
      "post": {
        "tags": ["Media & S3 Upload"],
        "summary": "Lấy Presigned URL để upload file trực tiếp lên S3",
        "description": "Tạo đường dẫn có chữ ký S3 PutObject với thời hạn 5 phút.",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["fileName", "fileType"],
                "properties": {
                  "fileName": { "type": "string", "example": "banner.png" },
                  "fileType": { "type": "string", "example": "image/png" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Lấy presigned URL thành công",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "uploadUrl": { "type": "string", "description": "Link có chữ ký để dùng lệnh PUT tải file lên S3" },
                    "fileUrl": { "type": "string", "description": "Link công khai sau khi upload hoàn tất" },
                    "key": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/upload": {
      "post": {
        "tags": ["Media & S3 Upload"],
        "summary": "Tải file trực tiếp qua Server Backend",
        "description": "Server nhận file qua multipart form-data và đẩy lên Amazon S3 qua SDK.",
        "requestBody": {
          "required": true,
          "content": {
            "multipart/form-data": {
              "schema": {
                "type": "object",
                "required": ["file"],
                "properties": {
                  "file": { "type": "string", "format": "binary" }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Upload thành công",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "url": { "type": "string" },
                    "key": { "type": "string" },
                    "bucket": { "type": "string" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/send-email": {
      "post": {
        "tags": ["Email Notification (SES)"],
        "summary": "Gửi email thông báo / Vé xác nhận tham gia qua Amazon SES",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["event_id"],
                "properties": {
                  "event_id": { "type": "string", "example": "aws-cloud-day-2026" },
                  "emails": {
                    "type": "array",
                    "items": { "type": "string", "format": "email" },
                    "example": ["attendee1@domain.com", "attendee2@domain.com"]
                  },
                  "email": { "type": "string", "format": "email", "example": "attendee@domain.com" },
                  "eventDetails": {
                    "type": "object",
                    "properties": {
                      "title": { "type": "string" },
                      "venue": { "type": "string" },
                      "start_at": { "type": "string" }
                    }
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Kết quả gửi email qua SES",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "message": { "type": "string" },
                    "total": { "type": "integer" },
                    "successCount": { "type": "integer" },
                    "failedCount": { "type": "integer" },
                    "results": { "type": "array", "items": { "type": "object" } }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Event": {
        "type": "object",
        "properties": {
          "event_id": { "type": "string", "example": "aws-cloud-day-2026" },
          "title": { "type": "string", "example": "AWS Cloud Practitioner Workshop 2026" },
          "description": { "type": "string", "example": "Hội thảo chuyên sâu về kiến trúc Serverless trên AWS." },
          "start_at": { "type": "string", "format": "date-time", "example": "2026-10-15 09:00:00" },
          "venue": { "type": "string", "example": "Hall A & Online" },
          "banner_url": { "type": "string", "example": "https://tuantm-assets-bucket.s3.ap-southeast-1.amazonaws.com/uploads/banner.png" },
          "created_at": { "type": "string", "format": "date-time" }
        }
      },
      "Attendee": {
        "type": "object",
        "properties": {
          "full_name": { "type": "string", "example": "Nguyễn Văn A" },
          "email": { "type": "string", "format": "email", "example": "vana@example.com" },
          "response": { "type": "string", "enum": ["Yes", "No"], "example": "Yes" },
          "avatar_url": { "type": "string", "nullable": true, "example": "https://tuantm-assets-bucket.s3.ap-southeast-1.amazonaws.com/uploads/avatar.png" },
          "timestamp": { "type": "integer", "example": 1759248000000 }
        }
      }
    }
  }
};
