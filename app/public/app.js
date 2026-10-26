// ========================================================
// ICTU TECHSTORE - CLIENT APPLICATION LOGIC
// ========================================================

const state = {
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('ictu_ecom_cart') || '[]'),
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'newest'
};

// DOM Elements
const productGrid = document.getElementById('productGrid');
const categoryTabs = document.getElementById('categoryTabs');
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const sortSelect = document.getElementById('sortSelect');

// Cart Drawer Elements
const openCartBtn = document.getElementById('openCartBtn');
const closeCartBtn = document.getElementById('closeCartBtn');
const cartBackdrop = document.getElementById('cartBackdrop');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartBadge = document.getElementById('cartBadge');
const drawerCartCount = document.getElementById('drawerCartCount');
const cartSubtotal = document.getElementById('cartSubtotal');
const cartTotal = document.getElementById('cartTotal');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

// Checkout Modal Elements
const checkoutModalBackdrop = document.getElementById('checkoutModalBackdrop');
const closeCheckoutBtn = document.getElementById('closeCheckoutBtn');
const checkoutForm = document.getElementById('checkoutForm');
const checkoutOrderItems = document.getElementById('checkoutOrderItems');
const reviewSubtotal = document.getElementById('reviewSubtotal');
const reviewTotal = document.getElementById('reviewTotal');

// Success Modal Elements
const successModalBackdrop = document.getElementById('successModalBackdrop');
const successOrderId = document.getElementById('successOrderId');
const successTotal = document.getElementById('successTotal');
const successViewOrdersBtn = document.getElementById('successViewOrdersBtn');
const successContinueShoppingBtn = document.getElementById('successContinueShoppingBtn');

// Orders Modal Elements
const viewOrdersBtn = document.getElementById('viewOrdersBtn');
const ordersModalBackdrop = document.getElementById('ordersModalBackdrop');
const closeOrdersBtn = document.getElementById('closeOrdersBtn');
const ordersTableBody = document.getElementById('ordersTableBody');

// Admin Add Product Elements
const adminAddProductBtn = document.getElementById('adminAddProductBtn');
const addProductModalBackdrop = document.getElementById('addProductModalBackdrop');
const closeAddProductBtn = document.getElementById('closeAddProductBtn');
const addProductForm = document.getElementById('addProductForm');

// Stats Elements
const statProducts = document.getElementById('statProducts');
const statOrders = document.getElementById('statOrders');
const statRevenue = document.getElementById('statRevenue');

// ========================================================
// UTILITY FUNCTIONS
// ========================================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="fa-solid ${type === 'success' ? 'fa-circle-check text-green' : 'fa-circle-exclamation text-red'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ========================================================
// INITIALIZATION & DATA FETCHING
// ========================================================
async function initApp() {
  await fetchCategories();
  await fetchProducts();
  await fetchStats();
  updateCartUI();
  setupEventListeners();
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const data = await res.json();
    statProducts.textContent = data.total_products || 0;
    statOrders.textContent = data.total_orders || 0;
    statRevenue.textContent = formatCurrency(data.total_revenue || 0);
  } catch (err) {
    console.error('Lỗi tải stats:', err);
  }
}

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Không thể tải danh mục');
    state.categories = await res.json();

    // Render category tabs
    let html = `<button class="tab-btn active" data-category="all">Tất cả sản phẩm</button>`;
    state.categories.forEach(cat => {
      html += `<button class="tab-btn" data-category="${cat.id}">${cat.name}</button>`;
    });
    categoryTabs.innerHTML = html;

    // Attach click events to category tabs
    categoryTabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        categoryTabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentCategory = btn.dataset.category;
        fetchProducts();
      });
    });
  } catch (err) {
    console.error(err);
  }
}

async function fetchProducts() {
  try {
    productGrid.innerHTML = `
      <div class="loading-state">
        <i class="fa-solid fa-spinner fa-spin"></i>
        <p>Đang tải dữ liệu sản phẩm từ MySQL...</p>
      </div>
    `;

    const params = new URLSearchParams();
    if (state.currentCategory && state.currentCategory !== 'all') {
      params.append('category_id', state.currentCategory);
    }
    if (state.searchQuery) {
      params.append('search', state.searchQuery);
    }
    if (state.sortBy) {
      params.append('sort', state.sortBy);
    }

    const res = await fetch(`/api/products?${params.toString()}`);
    if (!res.ok) throw new Error('Không thể tải sản phẩm');
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation text-red" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
        <p>Lỗi kết nối API: ${err.message}</p>
      </div>
    `;
  }
}

function renderProducts() {
  if (state.products.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-box-open" style="font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem;"></i>
        <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc hiện tại.</p>
      </div>
    `;
    return;
  }

  let html = '';
  state.products.forEach(p => {
    const isOutOfStock = p.stock <= 0;
    html += `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${p.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}" alt="${p.name}" loading="lazy">
          <span class="category-badge">${p.category_name || 'Công nghệ'}</span>
          <span class="stock-tag ${isOutOfStock ? 'out-of-stock' : 'in-stock'}">
            ${isOutOfStock ? 'Hết hàng' : `Còn ${p.stock} máy`}
          </span>
        </div>

        <div class="product-details">
          <h3 class="product-title" title="${p.name}">${p.name}</h3>
          
          <div class="product-rating">
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star"></i>
            <i class="fa-solid fa-star-half-stroke"></i>
            <span class="rating-num">(${p.rating || 4.9})</span>
          </div>

          <p class="product-desc">${p.description || 'Sản phẩm công nghệ chính hãng, bảo hành 12 tháng tại ICTU TechStore.'}</p>

          <div class="product-footer">
            <div class="product-price">${formatCurrency(p.price)}</div>
            <button class="add-to-cart-btn" data-id="${p.id}" ${isOutOfStock ? 'disabled' : ''}>
              <i class="fa-solid fa-cart-plus"></i>
              <span>${isOutOfStock ? 'Hết hàng' : 'Thêm giỏ'}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  });

  productGrid.innerHTML = html;

  // Gắn sự kiện Thêm vào giỏ
  productGrid.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const prodId = parseInt(btn.dataset.id);
      addToCart(prodId);
    });
  });
}

// ========================================================
// SHOPPING CART LOGIC
// ========================================================
function addToCart(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.product_id === productId);
  if (existingItem) {
    if (existingItem.quantity >= product.stock) {
      showToast(`Sản phẩm "${product.name}" chỉ còn ${product.stock} trong kho!`, 'error');
      return;
    }
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      stock: product.stock,
      quantity: 1
    });
  }

  // Ghi nhận Prometheus metric sự kiện thêm vào giỏ hàng
  fetch('/api/cart/event', { method: 'POST' }).catch(() => {});

  saveCart();
  updateCartUI();
  showToast(`Đã thêm "${product.name}" vào giỏ hàng!`);
}

function updateQuantity(productId, delta) {
  const item = state.cart.find(i => i.product_id === productId);
  if (!item) return;

  const newQty = item.quantity + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQty > item.stock) {
    showToast(`Kho chỉ còn ${item.stock} sản phẩm!`, 'error');
    return;
  }

  item.quantity = newQty;
  saveCart();
  updateCartUI();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(i => i.product_id !== productId);
  saveCart();
  updateCartUI();
  showToast('Đã xóa sản phẩm khỏi giỏ hàng.');
}

function saveCart() {
  localStorage.setItem('ictu_ecom_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  cartBadge.textContent = totalCount;
  drawerCartCount.textContent = `(${totalCount})`;
  cartSubtotal.textContent = formatCurrency(totalPrice);
  cartTotal.textContent = formatCurrency(totalPrice);

  if (state.cart.length === 0) {
    cartItemsContainer.innerHTML = `
      <div class="cart-empty">
        <i class="fa-solid fa-cart-arrow-down"></i>
        <p>Giỏ hàng của bạn đang trống</p>
      </div>
    `;
    proceedToCheckoutBtn.disabled = true;
  } else {
    let html = '';
    state.cart.forEach(item => {
      html += `
        <div class="cart-item">
          <img src="${item.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-info">
            <div class="cart-item-title">${item.name}</div>
            <div class="cart-item-price">${formatCurrency(item.price)}</div>
            <div class="cart-qty-control">
              <button class="qty-btn" onclick="updateQuantity(${item.product_id}, -1)">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn" onclick="updateQuantity(${item.product_id}, 1)">+</button>
            </div>
          </div>
          <button class="remove-item-btn" onclick="removeFromCart(${item.product_id})" title="Xóa">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      `;
    });
    cartItemsContainer.innerHTML = html;
    proceedToCheckoutBtn.disabled = false;
  }
}

// ========================================================
// CHECKOUT & ORDERS LOGIC
// ========================================================
function openCheckoutModal() {
  if (state.cart.length === 0) return;
  cartBackdrop.classList.remove('active');

  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  reviewSubtotal.textContent = formatCurrency(totalPrice);
  reviewTotal.textContent = formatCurrency(totalPrice);

  let html = '';
  state.cart.forEach(item => {
    html += `
      <div class="mini-item">
        <span>${item.name} <strong>x${item.quantity}</strong></span>
        <strong>${formatCurrency(item.price * item.quantity)}</strong>
      </div>
    `;
  });
  checkoutOrderItems.innerHTML = html;

  checkoutModalBackdrop.classList.add('active');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();

  const customer_name = document.getElementById('custName').value.trim();
  const customer_phone = document.getElementById('custPhone').value.trim();
  const customer_email = document.getElementById('custEmail').value.trim();
  const customer_address = document.getElementById('custAddress').value.trim();
  const payment_method = document.getElementById('paymentMethod').value;
  const notes = document.getElementById('orderNotes').value.trim();

  const orderPayload = {
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    payment_method,
    notes,
    items: state.cart.map(i => ({ product_id: i.product_id, quantity: i.quantity }))
  };

  const confirmBtn = document.getElementById('confirmOrderBtn');
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang xử lý...';

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Đặt hàng thất bại');

    // Đặt hàng thành công! Xóa giỏ hàng và hiển thị modal thành công
    state.cart = [];
    saveCart();
    updateCartUI();

    checkoutModalBackdrop.classList.remove('active');
    successOrderId.textContent = `#${data.order_id}`;
    successTotal.textContent = formatCurrency(data.total_amount);
    successModalBackdrop.classList.add('active');

    // Cập nhật lại sản phẩm và thống kê
    fetchProducts();
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Hoàn Tất Đặt Hàng';
  }
}

// ========================================================
// ORDERS MANAGEMENT MODAL
// ========================================================
async function openOrdersModal() {
  ordersModalBackdrop.classList.add('active');
  ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Đang tải danh sách đơn hàng...</td></tr>';

  try {
    const res = await fetch('/api/orders');
    if (!res.ok) throw new Error('Không thể tải đơn hàng');
    const orders = await res.json();

    if (orders.length === 0) {
      ordersTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Chưa có đơn hàng nào trong CSDL MySQL.</td></tr>';
      return;
    }

    let html = '';
    orders.forEach(o => {
      const dateFormatted = new Date(o.created_at).toLocaleString('vi-VN');
      html += `
        <tr>
          <td><strong>#${o.id}</strong></td>
          <td>
            <strong>${o.customer_name}</strong><br>
            <small class="text-muted">${o.customer_email || 'Không có email'}</small>
          </td>
          <td>${o.customer_phone}</td>
          <td><strong class="text-primary">${formatCurrency(o.total_amount)}</strong></td>
          <td><small>${dateFormatted}</small></td>
          <td>
            <span class="status-badge status-${o.status}">${o.status}</span>
          </td>
          <td>
            <select onchange="updateOrderStatus(${o.id}, this.value)" style="font-size: 0.75rem; padding: 0.2rem 0.4rem; border-radius: 4px;">
              <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Chờ xử lý</option>
              <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Đang giao</option>
              <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Hoàn thành</option>
              <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Hủy đơn</option>
            </select>
          </td>
        </tr>
      `;
    });
    ordersTableBody.innerHTML = html;
  } catch (err) {
    ordersTableBody.innerHTML = `<tr><td colspan="7" class="text-center text-red">Lỗi: ${err.message}</td></tr>`;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
    showToast(`Đã cập nhật đơn hàng #${orderId} sang "${newStatus}"`);
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ========================================================
// ADMIN ADD PRODUCT LOGIC
// ========================================================
async function handleAddProductSubmit(e) {
  e.preventDefault();

  const name = document.getElementById('prodName').value.trim();
  const category_id = parseInt(document.getElementById('prodCategory').value);
  const price = parseFloat(document.getElementById('prodPrice').value);
  const stock = parseInt(document.getElementById('prodStock').value);
  const image_url = document.getElementById('prodImage').value.trim();
  const description = document.getElementById('prodDesc').value.trim();

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;

  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category_id, price, stock, image_url, description })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Không thể thêm sản phẩm');

    showToast('Thêm sản phẩm thành công vào CSDL MySQL!');
    addProductModalBackdrop.classList.remove('active');
    addProductForm.reset();
    fetchProducts();
    fetchStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    saveBtn.disabled = false;
  }
}

// ========================================================
// EVENT LISTENERS
// ========================================================
function setupEventListeners() {
  // Cart Drawer
  openCartBtn.addEventListener('click', () => cartBackdrop.classList.add('active'));
  closeCartBtn.addEventListener('click', () => cartBackdrop.classList.remove('active'));
  cartBackdrop.addEventListener('click', (e) => {
    if (e.target === cartBackdrop) cartBackdrop.classList.remove('active');
  });

  // Checkout Modal
  proceedToCheckoutBtn.addEventListener('click', openCheckoutModal);
  closeCheckoutBtn.addEventListener('click', () => checkoutModalBackdrop.classList.remove('active'));
  checkoutModalBackdrop.addEventListener('click', (e) => {
    if (e.target === checkoutModalBackdrop) checkoutModalBackdrop.classList.remove('active');
  });
  checkoutForm.addEventListener('submit', handleCheckoutSubmit);

  // Success Modal
  successContinueShoppingBtn.addEventListener('click', () => successModalBackdrop.classList.remove('active'));
  successViewOrdersBtn.addEventListener('click', () => {
    successModalBackdrop.classList.remove('active');
    openOrdersModal();
  });
  successModalBackdrop.addEventListener('click', (e) => {
    if (e.target === successModalBackdrop) successModalBackdrop.classList.remove('active');
  });

  // Orders Modal
  viewOrdersBtn.addEventListener('click', openOrdersModal);
  closeOrdersBtn.addEventListener('click', () => ordersModalBackdrop.classList.remove('active'));
  ordersModalBackdrop.addEventListener('click', (e) => {
    if (e.target === ordersModalBackdrop) ordersModalBackdrop.classList.remove('active');
  });

  // Admin Add Product Modal
  adminAddProductBtn.addEventListener('click', () => addProductModalBackdrop.classList.add('active'));
  closeAddProductBtn.addEventListener('click', () => addProductModalBackdrop.classList.remove('active'));
  addProductModalBackdrop.addEventListener('click', (e) => {
    if (e.target === addProductModalBackdrop) addProductModalBackdrop.classList.remove('active');
  });
  addProductForm.addEventListener('submit', handleAddProductSubmit);

  // Search Input
  let debounceTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimeout);
    clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
    debounceTimeout = setTimeout(() => {
      state.searchQuery = searchInput.value.trim();
      fetchProducts();
    }, 300);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    state.searchQuery = '';
    fetchProducts();
  });

  // Sort Selector
  sortSelect.addEventListener('change', () => {
    state.sortBy = sortSelect.value;
    fetchProducts();
  });
}

// Make functions available globally for onclick handlers
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.updateOrderStatus = updateOrderStatus;

// Start app
document.addEventListener('DOMContentLoaded', initApp);
