const express = require('express');
const mysql = require('mysql2/promise');
const client = require('prom-client');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ========================================================
// PROMETHEUS METRICS SETUP
// ========================================================
const register = new client.Registry();
client.collectDefaultMetrics({ register, timeout: 5000 });

// 1. Tổng số lượt HTTP request theo method, route, status
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status'],
  registers: [register]
});

// 2. Thời gian phản hồi request (Histogram)
const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register]
});

// 3. Đơn hàng thành công & thất bại
const ecommerceOrdersTotal = new client.Counter({
  name: 'ecommerce_orders_total',
  help: 'Total number of ecommerce orders created',
  labelNames: ['status'],
  registers: [register]
});

// 4. Doanh thu bán hàng tích lũy (VND)
const ecommerceRevenueTotal = new client.Counter({
  name: 'ecommerce_revenue_total',
  help: 'Total accumulated revenue in VND',
  registers: [register]
});

// 5. Số lượng sản phẩm hiện có trong kho
const ecommerceProductsCount = new client.Gauge({
  name: 'ecommerce_products_count',
  help: 'Total number of active products in database',
  registers: [register]
});

// 6. Số lượt thêm vào giỏ hàng
const ecommerceCartAdditionsTotal = new client.Counter({
  name: 'ecommerce_cart_additions_total',
  help: 'Total number of cart addition events',
  registers: [register]
});

// Middleware ghi log JSON chuẩn hóa và đo lường metrics
app.use((req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const durationMs = (durationInSeconds * 1000).toFixed(2);

    const route = req.route ? req.route.path : req.path;
    httpRequestsTotal.inc({ method: req.method, route, status: res.statusCode });
    httpRequestDurationSeconds.observe({ method: req.method, route, status: res.statusCode }, durationInSeconds);

    const logData = {
      timestamp: new Date().toISOString(),
      service: 'ecommerce-app',
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: Number(durationMs),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    };
    console.log(JSON.stringify(logData));
  });

  next();
});

// ========================================================
// IN-MEMORY DATA STORE (FAIL-SAFE / STANDALONE MODE)
// ========================================================
const memoryStore = {
  categories: [
    { id: 1, name: 'Laptop & Máy tính', slug: 'laptop-may-tinh', description: 'Laptop văn phòng, gaming cao cấp' },
    { id: 2, name: 'Điện thoại & Tablet', slug: 'dien-thoai-tablet', description: 'Smartphone, iPad thế hệ mới nhất' },
    { id: 3, name: 'Phụ kiện công nghệ', slug: 'phu-kien-cong-nghe', description: 'Bàn phím cơ, chuột gaming, hub' },
    { id: 4, name: 'Âm thanh & Tai nghe', slug: 'am-thanh-tai-nghe', description: 'Tai nghe chống ồn, loa Bluetooth' }
  ],
  products: [
    {
      id: 1,
      category_id: 1,
      name: 'MacBook Pro 14 M3 Pro (18GB/512GB)',
      slug: 'macbook-pro-14-m3-pro',
      price: 48990000,
      stock: 15,
      description: 'Chip Apple M3 Pro cực mạnh, màn hình Liquid Retina XDR 120Hz sắc nét, pin dùng 18 giờ liên tục.',
      image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      id: 2,
      category_id: 1,
      name: 'Laptop Gaming ASUS ROG Zephyrus G16',
      slug: 'asus-rog-zephyrus-g16',
      price: 39990000,
      stock: 8,
      description: 'Intel Core Ultra 9, RTX 4070 8GB, màn OLED 240Hz, thiết kế nhôm nguyên khối siêu mỏng nhẹ.',
      image_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      id: 3,
      category_id: 2,
      name: 'iPhone 16 Pro Max 256GB Titan Sa Mạc',
      slug: 'iphone-16-pro-max-256gb',
      price: 34490000,
      stock: 25,
      description: 'Khung vỏ Titan cao cấp, chip A18 Pro hỗ trợ Apple Intelligence, nút Camera Control thế hệ mới.',
      image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
      rating: 5.0
    },
    {
      id: 4,
      category_id: 2,
      name: 'Samsung Galaxy S24 Ultra 5G (12GB/256GB)',
      slug: 'samsung-galaxy-s24-ultra',
      price: 28990000,
      stock: 20,
      description: 'Quyền năng Galaxy AI, camera zoom 100x 200MP, bút S-Pen tích hợp, viền Titanium bền bỉ.',
      image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80',
      rating: 4.7
    },
    {
      id: 5,
      category_id: 3,
      name: 'Bàn phím cơ Custom Keychron Q1 Pro Wireless',
      slug: 'keychron-q1-pro-wireless',
      price: 4350000,
      stock: 30,
      description: 'Vỏ nhôm CNC nguyên khối, gasket mount êm ái, switch Gateron Jupiter, kết nối 3 thiết bị Bluetooth.',
      image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      id: 6,
      category_id: 3,
      name: 'Chuột không dây Logitech MX Master 3S',
      slug: 'logitech-mx-master-3s',
      price: 2150000,
      stock: 45,
      description: 'Cảm biến 8000 DPI siêu êm Silent Clicks, con lăn điện từ MagSpeed cuộn 1000 dòng/giây.',
      image_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    },
    {
      id: 7,
      category_id: 4,
      name: 'Tai nghe chống ồn Sony WH-1000XM5',
      slug: 'sony-wh-1000xm5',
      price: 6890000,
      stock: 18,
      description: 'Bộ xử lý chống ồn V1 & QN1 đỉnh cao thế giới, thời lượng pin 30 giờ, micro lọc gió đàm thoại cực rõ.',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      rating: 4.8
    },
    {
      id: 8,
      category_id: 4,
      name: 'Tai nghe Apple AirPods Pro 2 (USB-C)',
      slug: 'apple-airpods-pro-2-usb-c',
      price: 5590000,
      stock: 40,
      description: 'Chống ồn chủ động gấp 2 lần, chip H2, âm thanh không gian cá nhân hóa Spatial Audio.',
      image_url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=800&q=80',
      rating: 4.9
    }
  ],
  orders: [
    {
      id: 1001,
      customer_name: 'Nguyễn Văn An',
      customer_email: 'an.nguyen@ictu.edu.vn',
      customer_phone: '0912345678',
      customer_address: 'Số 12 đường Z115, TP Thái Nguyên',
      total_amount: 4350000,
      status: 'completed',
      payment_method: 'COD',
      notes: 'Giao trong giờ hành chính',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      items: [
        { product_id: 5, product_name: 'Bàn phím cơ Custom Keychron Q1 Pro Wireless', quantity: 1, unit_price: 4350000, subtotal: 4350000 }
      ]
    },
    {
      id: 1002,
      customer_name: 'Trần Thị Mai',
      customer_email: 'mai.tran@gmail.com',
      customer_phone: '0987654321',
      customer_address: 'Ký túc xá Đại học CNTT & TT Thái Nguyên',
      total_amount: 34490000,
      status: 'processing',
      payment_method: 'Chuyển khoản',
      notes: 'Gọi trước khi đến 15 phút',
      created_at: new Date().toISOString(),
      items: [
        { product_id: 3, product_name: 'iPhone 16 Pro Max 256GB Titan Sa Mạc', quantity: 1, unit_price: 34490000, subtotal: 34490000 }
      ]
    }
  ]
};

// Cập nhật giá trị metric sản phẩm ban đầu
ecommerceProductsCount.set(memoryStore.products.length);

// ========================================================
// KẾT NỐI CƠ SỞ DỮ LIỆU MYSQL (TỰ ĐỘNG THỬ LẠI & HYBRID FALLBACK)
// ========================================================
let db = null;
let dbConnected = false;

// Tự động nhận diện host: nếu chạy trong Docker dùng 'db', nếu chạy trực tiếp Windows dùng 'localhost'
const isDocker = fs.existsSync('/.dockerenv') || process.env.IS_DOCKER;
const defaultDbHost = isDocker ? 'db' : '127.0.0.1';
const DB_HOST = process.env.DB_HOST || defaultDbHost;

async function connectToDatabase() {
  try {
    console.log(`[DB] Đang thử kết nối MySQL tại host '${DB_HOST}'...`);
    const pool = await mysql.createPool({
      host: DB_HOST,
      user: process.env.DB_USER || 'ecommerce_user',
      password: process.env.DB_PASSWORD || 'ecommerce_pass',
      database: process.env.DB_NAME || 'ecommerce_db',
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 4000,
      charset: 'utf8mb4'
    });

    await pool.query('SELECT 1');
    db = pool;
    dbConnected = true;
    console.log('[DB] Kết nối CSDL MySQL THÀNH CÔNG! Đang đồng bộ dữ liệu...');
    await syncDbSchema();
  } catch (err) {
    dbConnected = false;
    console.warn(`[DB] Chưa thể kết nối MySQL (${err.code || err.message}). Ứng dụng tự động hoạt động ở chế độ Standalone/In-Memory an toàn.`);
  }
}

async function syncDbSchema() {
  if (!db) return;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NULL,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        description TEXT,
        image_url VARCHAR(500),
        rating DECIMAL(2,1) DEFAULT 5.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        customer_email VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'COD',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        subtotal DECIMAL(12,2) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Kiểm tra và seed sản phẩm nếu bảng trống
    const [pRows] = await db.query('SELECT COUNT(*) as count FROM products');
    if (pRows[0].count === 0) {
      for (const cat of memoryStore.categories) {
        await db.query('INSERT IGNORE INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)',
          [cat.id, cat.name, cat.slug, cat.description]);
      }
      for (const prod of memoryStore.products) {
        await db.query(`
          INSERT IGNORE INTO products (id, category_id, name, slug, price, stock, description, image_url, rating)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [prod.id, prod.category_id, prod.name, prod.slug, prod.price, prod.stock, prod.description, prod.image_url, prod.rating]);
      }
      console.log('[DB] Đã nạp thành công dữ liệu mẫu vào MySQL!');
    }

    const [rows] = await db.query('SELECT COUNT(*) as count FROM products');
    ecommerceProductsCount.set(rows[0].count);
  } catch (err) {
    console.error('[DB] Lỗi đồng bộ schema:', err.message);
  }
}

// Thử kết nối lúc khởi động và định kỳ thử lại
connectToDatabase();
setInterval(() => {
  if (!dbConnected) {
    connectToDatabase();
  }
}, 30000);

// ========================================================
// SYSTEM & MONITORING ENDPOINTS
// ========================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    database_mode: dbConnected ? 'MYSQL_CONNECTED' : 'STANDALONE_IN_MEMORY',
    database_host: DB_HOST,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

// ========================================================
// E-COMMERCE RESTFUL APIS (DUAL-MODE: MYSQL / IN-MEMORY)
// ========================================================

// 1. Lấy danh sách danh mục
app.get('/api/categories', async (req, res) => {
  if (dbConnected && db) {
    try {
      const [categories] = await db.query('SELECT * FROM categories ORDER BY id ASC');
      return res.json(categories);
    } catch (e) {
      // fallback
    }
  }
  res.json(memoryStore.categories);
});

// 2. Lấy danh sách sản phẩm (có hỗ trợ lọc theo category_id, tìm kiếm, sắp xếp)
app.get('/api/products', async (req, res) => {
  const { category_id, search, sort } = req.query;

  if (dbConnected && db) {
    try {
      let sql = `
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE 1=1
      `;
      const params = [];

      if (category_id && category_id !== 'all') {
        sql += ' AND p.category_id = ?';
        params.push(category_id);
      }

      if (search) {
        sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (sort === 'price_asc') {
        sql += ' ORDER BY p.price ASC';
      } else if (sort === 'price_desc') {
        sql += ' ORDER BY p.price DESC';
      } else {
        sql += ' ORDER BY p.id DESC';
      }

      const [products] = await db.query(sql, params);
      return res.json(products);
    } catch (err) {
      console.warn('[API] Query MySQL thất bại, chuyển sang bộ nhớ đệm:', err.message);
    }
  }

  // In-memory fallback
  let list = memoryStore.products.map(p => {
    const cat = memoryStore.categories.find(c => c.id === p.category_id);
    return { ...p, category_name: cat ? cat.name : 'Công nghệ' };
  });

  if (category_id && category_id !== 'all') {
    list = list.filter(p => String(p.category_id) === String(category_id));
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
  }

  if (sort === 'price_asc') {
    list.sort((a, b) => a.price - b.price);
  } else if (sort === 'price_desc') {
    list.sort((a, b) => b.price - a.price);
  } else {
    list.sort((a, b) => b.id - a.id);
  }

  res.json(list);
});

// 3. Lấy chi tiết 1 sản phẩm
app.get('/api/products/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (dbConnected && db) {
    try {
      const [products] = await db.query(`
        SELECT p.*, c.name as category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.id = ?
      `, [id]);
      if (products.length > 0) return res.json(products[0]);
    } catch (e) {}
  }

  const p = memoryStore.products.find(item => item.id === id);
  if (!p) return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });

  const cat = memoryStore.categories.find(c => c.id === p.category_id);
  res.json({ ...p, category_name: cat ? cat.name : 'Công nghệ' });
});

// 4. Thêm sản phẩm mới (Admin)
app.post('/api/products', async (req, res) => {
  const { name, category_id, price, stock, description, image_url } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Tên sản phẩm và giá không được để trống' });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const parsedPrice = parseFloat(price);
  const parsedStock = parseInt(stock) || 0;
  const parsedCatId = parseInt(category_id) || 1;
  const img = image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';

  if (dbConnected && db) {
    try {
      const [result] = await db.query(`
        INSERT INTO products (name, slug, category_id, price, stock, description, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, slug + '-' + Date.now().toString().slice(-4), parsedCatId, parsedPrice, parsedStock, description || '', img]);

      const [rows] = await db.query('SELECT COUNT(*) as count FROM products');
      ecommerceProductsCount.set(rows[0].count);
      return res.status(201).json({ message: 'Thêm sản phẩm thành công vào MySQL', id: result.insertId });
    } catch (err) {
      console.warn('Lỗi insert MySQL, lưu tạm bộ nhớ:', err.message);
    }
  }

  const newId = memoryStore.products.length ? Math.max(...memoryStore.products.map(p => p.id)) + 1 : 1;
  const newProduct = {
    id: newId,
    category_id: parsedCatId,
    name,
    slug,
    price: parsedPrice,
    stock: parsedStock,
    description: description || '',
    image_url: img,
    rating: 5.0
  };
  memoryStore.products.unshift(newProduct);
  ecommerceProductsCount.set(memoryStore.products.length);

  res.status(201).json({ message: 'Thêm sản phẩm thành công', id: newId });
});

// 5. Ghi nhận sự kiện thêm giỏ hàng
app.post('/api/cart/event', (req, res) => {
  ecommerceCartAdditionsTotal.inc();
  res.json({ success: true });
});

// 6. Đặt hàng từ giỏ hàng (Transaction an toàn)
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_email, customer_phone, customer_address, payment_method, notes, items } = req.body;

  if (!customer_name || !customer_phone || !items || !Array.isArray(items) || items.length === 0) {
    ecommerceOrdersTotal.inc({ status: 'failed' });
    return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin khách hàng và giỏ hàng' });
  }

  // Thử thực hiện trên MySQL nếu kết nối sẵn sàng
  if (dbConnected && db) {
    let connection;
    try {
      connection = await db.getConnection();
      await connection.beginTransaction();

      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const [rows] = await connection.query('SELECT * FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
        if (rows.length === 0) throw new Error(`Sản phẩm #${item.product_id} không tồn tại`);
        const prod = rows[0];
        const qty = parseInt(item.quantity) || 1;
        if (prod.stock < qty) throw new Error(`Sản phẩm "${prod.name}" chỉ còn ${prod.stock} trong kho!`);

        const subtotal = prod.price * qty;
        totalAmount += subtotal;
        validatedItems.push({ product_id: prod.id, product_name: prod.name, quantity: qty, unit_price: prod.price, subtotal });
      }

      const [orderResult] = await connection.query(`
        INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, total_amount, status, payment_method, notes)
        VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
      `, [customer_name, customer_email || '', customer_phone, customer_address || '', totalAmount, payment_method || 'COD', notes || '']);

      const orderId = orderResult.insertId;

      for (const valItem of validatedItems) {
        await connection.query(`
          INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [orderId, valItem.product_id, valItem.product_name, valItem.quantity, valItem.unit_price, valItem.subtotal]);

        await connection.query('UPDATE products SET stock = stock - ? WHERE id = ?', [valItem.quantity, valItem.product_id]);
      }

      await connection.commit();
      ecommerceOrdersTotal.inc({ status: 'completed' });
      ecommerceRevenueTotal.inc(totalAmount);

      return res.status(201).json({ message: 'Đặt hàng thành công!', order_id: orderId, total_amount: totalAmount });
    } catch (err) {
      if (connection) await connection.rollback();
      ecommerceOrdersTotal.inc({ status: 'failed' });
      return res.status(400).json({ error: err.message });
    } finally {
      if (connection) connection.release();
    }
  }

  // In-Memory Order Processing (Chế độ Standalone)
  try {
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = memoryStore.products.find(p => p.id === item.product_id);
      if (!prod) throw new Error(`Sản phẩm #${item.product_id} không tồn tại`);
      const qty = parseInt(item.quantity) || 1;
      if (prod.stock < qty) throw new Error(`Sản phẩm "${prod.name}" chỉ còn ${prod.stock} trong kho!`);

      const subtotal = prod.price * qty;
      totalAmount += subtotal;
      validatedItems.push({
        product_id: prod.id,
        product_name: prod.name,
        quantity: qty,
        unit_price: prod.price,
        subtotal
      });
    }

    // Trừ kho
    for (const item of items) {
      const prod = memoryStore.products.find(p => p.id === item.product_id);
      prod.stock -= (parseInt(item.quantity) || 1);
    }

    const newOrderId = memoryStore.orders.length ? Math.max(...memoryStore.orders.map(o => o.id)) + 1 : 1001;
    const newOrder = {
      id: newOrderId,
      customer_name,
      customer_email: customer_email || '',
      customer_phone,
      customer_address: customer_address || '',
      total_amount: totalAmount,
      status: 'pending',
      payment_method: payment_method || 'COD',
      notes: notes || '',
      created_at: new Date().toISOString(),
      items: validatedItems
    };

    memoryStore.orders.unshift(newOrder);
    ecommerceOrdersTotal.inc({ status: 'completed' });
    ecommerceRevenueTotal.inc(totalAmount);

    res.status(201).json({
      message: 'Đặt hàng thành công!',
      order_id: newOrderId,
      total_amount: totalAmount
    });
  } catch (err) {
    ecommerceOrdersTotal.inc({ status: 'failed' });
    res.status(400).json({ error: err.message });
  }
});

// 7. Lấy danh sách đơn hàng
app.get('/api/orders', async (req, res) => {
  if (dbConnected && db) {
    try {
      const [orders] = await db.query('SELECT * FROM orders ORDER BY id DESC LIMIT 50');
      for (let order of orders) {
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }
      return res.json(orders);
    } catch (e) {}
  }
  res.json(memoryStore.orders);
});

// 8. Cập nhật trạng thái đơn hàng
app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const id = parseInt(req.params.id);

  if (dbConnected && db) {
    try {
      await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
      return res.json({ message: 'Cập nhật trạng thái thành công' });
    } catch (e) {}
  }

  const order = memoryStore.orders.find(o => o.id === id);
  if (order) {
    order.status = status;
    return res.json({ message: 'Cập nhật trạng thái thành công' });
  }
  res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
});

// 9. Thống kê tổng quan
app.get('/api/stats', async (req, res) => {
  if (dbConnected && db) {
    try {
      const [p] = await db.query('SELECT COUNT(*) as total FROM products');
      const [o] = await db.query('SELECT COUNT(*) as total FROM orders');
      const [r] = await db.query('SELECT IFNULL(SUM(total_amount), 0) as total FROM orders WHERE status != "cancelled"');
      return res.json({
        total_products: p[0].total,
        total_orders: o[0].total,
        total_revenue: r[0].total
      });
    } catch (e) {}
  }

  const totalRevenue = memoryStore.orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total_amount || 0), 0);

  res.json({
    total_products: memoryStore.products.length,
    total_orders: memoryStore.orders.length,
    total_revenue: totalRevenue
  });
});

// Fallback route cho Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`[STARTUP] E-Commerce Server đang chạy tại cổng ${PORT}`);
  console.log(`[URL]     Truy cập Website:          http://localhost:${PORT}`);
  console.log(`[METRICS] Endpoint giám sát Prometheus: http://localhost:${PORT}/metrics`);
  console.log(`[HEALTH]  Endpoint kiểm tra sức khỏe:   http://localhost:${PORT}/health`);
  console.log(`====================================================`);
});
