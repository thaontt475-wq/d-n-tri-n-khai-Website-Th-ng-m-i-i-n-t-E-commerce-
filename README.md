# Dự Án Triển Khai Hệ Thống E-Commerce & Giám Sát Tập Trung

Hệ thống thương mại điện tử hoàn chỉnh được đóng gói bằng Docker Compose, tích hợp Reverse Proxy SSL, quản trị cơ sở dữ liệu và bộ giải pháp giám sát tập trung (Monitoring & Logging).

---

## Kiến Trúc Hệ Thống (9 Dịch Vụ)

- **Reverse Proxy & SSL:** Nginx (Cổng 80/443, tự chuyển hướng HTTPS, SSL tự ký, Security Headers).
- **Ứng Dụng Backend:** Node.js Express (Cổng nội bộ 3000, API `/api/products`, xuất chỉ số `/metrics`).
- **Cơ Sở Dữ Liệu:** MySQL 8.0 (Docker Volume lưu trữ bền vững).
- **Quản Trị DB:** phpMyAdmin (Định tuyến qua `https://localhost/phpmyadmin/`).
- **Thu Thập Metrics:** Prometheus (Cổng 9090, giám sát cAdvisor và Node.js App).
- **Giám Sát Phần Cứng Container:** cAdvisor (Cổng 8080).
- **Thu Thập Log Tập Trung:** Promtail (Đọc log Nginx dạng JSON) & Loki (Lưu trữ và truy vấn log).
- **Trực Quan Hóa Dữ Liệu:** Grafana (Cổng 3001, tích hợp Dashboard cAdvisor 14282 và LogQL).

---

## Hướng Dẫn Triển Khai Nhanh

### 1. Chuẩn bị biến môi trường
Tạo file `.env`:
```env
DB_ROOT_PASSWORD=supersecretroot
DB_NAME=ecommerce_db
DB_USER=ecommerce_user
DB_PASSWORD=ecommerce_pass
