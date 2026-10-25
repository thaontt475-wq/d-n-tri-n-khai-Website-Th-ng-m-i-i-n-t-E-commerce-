const express = require('express');
const mysql = require('mysql2/promise');
const client = require('prom-client');

const app = express();
app.use(express.json());

// Prometheus Metrics setup
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// MySQL Connection Pool
let db;
async function initDb() {
  db = await mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'ecom_user',
    password: process.env.DB_PASSWORD || 'Secret123!Secure',
    database: process.env.DB_NAME || 'ecommerce_db',
    waitForConnections: true,
    connectionLimit: 10
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0
    );
  `);
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT,
      quantity INT,
      total_price DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const [rows] = await db.query('SELECT COUNT(*) AS count FROM products');
  if (rows[0].count === 0) {
    await db.query(`
      INSERT INTO products (name, price, stock) VALUES 
      ('Bàn phím cơ', 1200000, 15),
      ('Chuột không dây', 450000, 30),
      ('Tai nghe chống ồn', 2500000, 10);
    `);
  }
}
initDb().catch(console.error);

// Routes
app.get('/health', (req, res) => res.json({ status: 'UP' }));

app.get('/api/products', async (req, res) => {
  try {
    const [products] = await db.query('SELECT * FROM products');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { product_id, quantity } = req.body;
  try {
    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [product_id]);
    if (products.length === 0) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    
    const product = products[0];
    if (product.stock < quantity) return res.status(400).json({ error: 'Hàng không đủ số lượng' });

    const total = product.price * quantity;
    const [result] = await db.query('INSERT INTO orders (product_id, quantity, total_price) VALUES (?, ?, ?)', [product_id, quantity, total]);
    await db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, product_id]);

    console.log(`[ORDER] Created order ID: ${result.insertId} for Product: ${product.name}`);
    res.status(201).json({ order_id: result.insertId, total_price: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Ecommerce backend listening on port ${PORT}`);
});
