const ADMINS_KEY = 'store_admins';
const PRODUCTS_KEY = 'store_products';
const ORDERS_KEY = 'store_orders';
const CONTACTS_KEY = 'store_contacts';
const CART_KEY = 'store_cart';

const DEFAULT_ADMINS = [
  { id: 'admin1', username: 'Nengi', password: 'Juniorjake8', status: 'offline', lastSeen: new Date().toISOString() },
  { id: 'admin2', username: 'Kufre', password: 'Kufre', status: 'offline', lastSeen: new Date().toISOString() }
];

const DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
const FOOTWEAR_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45'];

function getData(key, fallback) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch (e) { return fallback; }
}

function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getAdmins() {
  let admins = getData(ADMINS_KEY, null);
  if (!admins) {
    setData(ADMINS_KEY, DEFAULT_ADMINS);
    return DEFAULT_ADMINS;
  }
  return admins;
}

function updateAdminLastSeen(username) {
  const admins = getAdmins();
  const a = admins.find(x => x.username === username);
  if (a) {
    a.lastSeen = new Date().toISOString();
    a.status = 'online';
    setData(ADMINS_KEY, admins);
  }
}

function addAdmin(admin) {
  const admins = getAdmins();
  admins.push(admin);
  setData(ADMINS_KEY, admins);
}

function updateAdmin(id, data) {
  const admins = getAdmins();
  const idx = admins.findIndex(a => a.id === id);
  if (idx !== -1) {
    admins[idx] = { ...admins[idx], ...data };
    setData(ADMINS_KEY, admins);
  }
}

function deleteAdmin(id) {
  let admins = getAdmins();
  admins = admins.filter(a => a.id !== id);
  setData(ADMINS_KEY, admins);
}

function setAdminOffline(username) {
  const admins = getAdmins();
  const a = admins.find(x => x.username === username);
  if (a) {
    a.status = 'offline';
    a.lastSeen = new Date().toISOString();
    setData(ADMINS_KEY, admins);
  }
}

function authenticateAdmin(username, password) {
  const admins = getAdmins();
  return admins.find(a => a.username === username && a.password === password) || null;
}

function getProducts() {
  return getData(PRODUCTS_KEY, []);
}

function saveProduct(product) {
  const prods = getProducts();
  prods.push(product);
  setData(PRODUCTS_KEY, prods);
}

function updateProduct(id, data) {
  const prods = getProducts();
  const idx = prods.findIndex(p => p.id === id);
  if (idx !== -1) {
    prods[idx] = { ...prods[idx], ...data };
    setData(PRODUCTS_KEY, prods);
  }
}

function deleteProduct(id) {
  let prods = getProducts();
  prods = prods.filter(p => p.id !== id);
  setData(PRODUCTS_KEY, prods);
}

function getOrders() {
  return getData(ORDERS_KEY, []);
}

function placeOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  setData(ORDERS_KEY, orders);
}

function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const o = orders.find(x => x.id === orderId);
  if (o) { o.status = status; setData(ORDERS_KEY, orders); }
}

function deleteOrder(orderId) {
  let orders = getOrders();
  orders = orders.filter(o => o.id !== orderId);
  setData(ORDERS_KEY, orders);
}

function getContacts() {
  return getData(CONTACTS_KEY, []);
}

function saveContact(contact) {
  const contacts = getContacts();
  contacts.unshift(contact);
  setData(CONTACTS_KEY, contacts);
}

function deleteContact(id) {
  let contacts = getContacts();
  contacts = contacts.filter(c => c.id !== id);
  setData(CONTACTS_KEY, contacts);
}

function getCart() {
  return getData(CART_KEY, []);
}

function saveCart(cart) {
  setData(CART_KEY, cart);
}

function addToCart(product, size) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product.id && item.size === size);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1, size: size || '' });
  }
  saveCart(cart);
}

function removeFromCart(productId, size) {
  let cart = getCart();
  if (size !== undefined && size !== null) {
    cart = cart.filter(item => !(item.id === productId && (item.size || '') === (size || '')));
  } else {
    cart = cart.filter(item => item.id !== productId);
  }
  saveCart(cart);
}

function updateCartQty(productId, size, qty) {
  const cart = getCart();
  const item = cart.find(x => x.id === productId && x.size === size);
  if (item) {
    if (qty <= 0) return removeFromCart(productId, size);
    item.qty = qty;
    saveCart(cart);
  }
}

function clearCart() {
  saveCart([]);
}

function getCartTotal() {
  return getCart().reduce((sum, item) => sum + (parseFloat(item.price) * item.qty), 0);
}

function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.qty, 0);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function formatPrice(n) {
  return '\u20A6' + Number(n).toLocaleString();
}

function formatDate(iso) {
  return new Date(iso).toLocaleString();
}

function getSizesForCategory(category) {
  return category === 'Footwears' ? FOOTWEAR_SIZES : DEFAULT_SIZES;
}

function getTotalStock(product) {
  if (product.sizes && typeof product.sizes === 'object') {
    var total = 0;
    for (var s in product.sizes) {
      if (product.sizes.hasOwnProperty(s)) total += Number(product.sizes[s]) || 0;
    }
    return total;
  }
  return Number(product.stock) || 0;
}

function getSizeStock(product, size) {
  if (product.sizes && typeof product.sizes === 'object') {
    return Number(product.sizes[size]) || 0;
  }
  if (product.stock !== undefined && (!size || size === '')) return Number(product.stock) || 0;
  return 0;
}

function decreaseSizeStock(product, size) {
  if (!product.sizes) product.sizes = {};
  var current = Number(product.sizes[size]) || 0;
  if (current > 0) {
    product.sizes[size] = current - 1;
  }
}
