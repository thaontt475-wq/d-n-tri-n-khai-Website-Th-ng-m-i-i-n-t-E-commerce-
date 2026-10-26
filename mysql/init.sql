-- Khởi tạo Cơ sở Dữ liệu cho Website Thương Mại Điện Tử (Đề 9 - ICTU)
-- Bảng mã: utf8mb4 hỗ trợ tiếng Việt đầy đủ

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Bảng Danh mục sản phẩm (categories)
CREATE TABLE IF NOT EXISTS `categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Sản phẩm (products)
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL,
  `price` DECIMAL(12, 2) NOT NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `rating` DECIMAL(2, 1) DEFAULT 5.0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Đơn hàng (orders)
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `customer_address` TEXT NOT NULL,
  `total_amount` DECIMAL(12, 2) NOT NULL,
  `status` ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
  `payment_method` VARCHAR(50) DEFAULT 'COD',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng Chi tiết đơn hàng (order_items)
CREATE TABLE IF NOT EXISTS `order_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(12, 2) NOT NULL,
  `subtotal` DECIMAL(12, 2) NOT NULL,
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================
-- DỮ LIỆU KHỞI TẠO BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Laptop & Máy tính', 'laptop-may-tinh', 'Laptop văn phòng, gaming, đồ họa chính hãng cao cấp'),
(2, 'Điện thoại & Tablet', 'dien-thoai-tablet', 'Smartphone, iPad, máy tính bảng thế hệ mới nhất'),
(3, 'Phụ kiện công nghệ', 'phu-kien-cong-nghe', 'Bàn phím cơ, chuột gaming, hub chuyển đổi, sạc dự phòng'),
(4, 'Âm thanh & Tai nghe', 'am-thanh-tai-nghe', 'Tai nghe True Wireless, tai nghe chụp tai chống ồn, loa Bluetooth');

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `price`, `stock`, `description`, `image_url`, `rating`) VALUES
(1, 1, 'MacBook Pro 14 M3 Pro (18GB/512GB)', 'macbook-pro-14-m3-pro', 48990000, 15, 'Chip Apple M3 Pro cực mạnh, màn hình Liquid Retina XDR 120Hz sắc nét, pin dùng 18 giờ liên tục.', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', 4.9),
(2, 1, 'Laptop Gaming ASUS ROG Zephyrus G16', 'asus-rog-zephyrus-g16', 39990000, 8, 'Intel Core Ultra 9, RTX 4070 8GB, màn OLED 240Hz, thiết kế nhôm nguyên khối siêu mỏng nhẹ.', 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80', 4.8),
(3, 2, 'iPhone 16 Pro Max 256GB Titan Sa Mạc', 'iphone-16-pro-max-256gb', 34490000, 25, 'Khung vỏ Titan cao cấp, chip A18 Pro hỗ trợ Apple Intelligence, nút Camera Control thế hệ mới.', 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80', 5.0),
(4, 2, 'Samsung Galaxy S24 Ultra 5G (12GB/256GB)', 'samsung-galaxy-s24-ultra', 28990000, 20, 'Quyền năng Galaxy AI, camera zoom 100x 200MP, bút S-Pen tích hợp, viền Titanium bền bỉ.', 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80', 4.7),
(5, 3, 'Bàn phím cơ Custom Keychron Q1 Pro Wireless', 'keychron-q1-pro-wireless', 4350000, 30, 'Vỏ nhôm CNC nguyên khối, gasket mount êm ái, switch Gateron Jupiter, kết nối 3 thiết bị Bluetooth.', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', 4.9),
(6, 3, 'Chuột không dây Logitech MX Master 3S', 'logitech-mx-master-3s', 2150000, 45, 'Cảm biến 8000 DPI siêu êm Silent Clicks, con lăn điện từ MagSpeed cuộn 1000 dòng/giây.', 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80', 4.9),
(7, 4, 'Tai nghe chống ồn Sony WH-1000XM5', 'sony-wh-1000xm5', 6890000, 18, 'Bộ xử lý chống ồn V1 & QN1 đỉnh cao thế giới, thời lượng pin 30 giờ, micro lọc gió đàm thoại cực rõ.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 4.8),
(8, 4, 'Tai nghe Apple AirPods Pro 2 (USB-C)', 'apple-airpods-pro-2-usb-c', 5590000, 40, 'Chống ồn chủ động gấp 2 lần, chip H2, âm thanh không gian cá nhân hóa Spatial Audio.', 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80', 4.9);

-- Thêm một số đơn hàng mẫu
INSERT INTO `orders` (`id`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `total_amount`, `status`, `payment_method`, `notes`) VALUES
(1001, 'Nguyễn Văn An', 'an.nguyen@ictu.edu.vn', '0912345678', 'Số 12 đường Z115, TP Thái Nguyên', 4350000, 'completed', 'COD', 'Giao trong giờ hành chính'),
(1002, 'Trần Thị Mai', 'mai.tran@gmail.com', '0987654321', 'Ký túc xá Đại học CNTT & TT Thái Nguyên', 34490000, 'processing', 'Chuyển khoản', 'Gọi trước khi đến 15 phút');

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `subtotal`) VALUES
(1001, 5, 'Bàn phím cơ Custom Keychron Q1 Pro Wireless', 1, 4350000, 4350000),
(1002, 3, 'iPhone 16 Pro Max 256GB Titan Sa Mạc', 1, 34490000, 34490000);
