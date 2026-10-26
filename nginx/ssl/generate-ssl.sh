#!/bin/bash
# Script tự động sinh chứng chỉ SSL tự ký cho Nginx Reverse Proxy
# Đề tài 9 - ICTU E-Commerce Monitoring

SSL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Đang tạo chứng chỉ SSL tự ký (selfsigned.key & selfsigned.crt)..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout "$SSL_DIR/selfsigned.key" \
  -out "$SSL_DIR/selfsigned.crt" \
  -subj "/C=VN/ST=ThaiNguyen/L=ThaiNguyen/O=ICTU/OU=DevOps/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Tạo chứng chỉ SSL thành công tại $SSL_DIR!"
