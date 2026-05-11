var PRODUCTS_KEY = 'store_products';
var ORDERS_KEY = 'store_orders';
var CONTACTS_KEY = 'store_contacts';
var CART_KEY = 'store_cart';
var ADMINS_KEY = 'store_admins';

var DEFAULT_ADMINS = [
  { id: 'admin1', email: 'nengi@6thwearz.com', displayName: 'Nengi', password: 'Juniorjake8', status: 'offline', lastSeen: new Date().toISOString() },
  { id: 'admin2', email: 'kufre@6thwearz.com', displayName: 'Kufre', password: 'Kufre', status: 'offline', lastSeen: new Date().toISOString() }
];

var DEFAULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
var FOOTWEAR_SIZES = ['38', '39', '40', '41', '42', '43', '44', '45'];

var _cache = { products: [], orders: [], admins: [], contacts: [] };

var dbReady = initCache();

async function initCache() {
  try {
    var snapshots = await Promise.all([
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('admins').get(),
      db.collection('contacts').get()
    ]);
    _cache.products = snapshots[0].empty ? [] : snapshots[0].docs.map(function (d) { return d.data(); });
    _cache.orders = snapshots[1].empty ? [] : snapshots[1].docs.map(function (d) { return d.data(); });
    _cache.admins = snapshots[2].empty ? [] : snapshots[2].docs.map(function (d) { return d.data(); });
    _cache.contacts = snapshots[3].empty ? [] : snapshots[3].docs.map(function (d) { return d.data(); });
    await migrateFromLocal();
  } catch (e) {
    console.error('Firestore init failed, falling back to localStorage', e);
    _cache.products = getLocal(PRODUCTS_KEY, []);
    _cache.orders = getLocal(ORDERS_KEY, []);
    _cache.admins = getLocal(ADMINS_KEY, DEFAULT_ADMINS);
    _cache.contacts = getLocal(CONTACTS_KEY, []);
  }
}

async function migrateFromLocal() {
  var localProducts = getLocal(PRODUCTS_KEY, []);
  var localOrders = getLocal(ORDERS_KEY, []);
  var localContacts = getLocal(CONTACTS_KEY, []);
  var localAdmins = getLocal(ADMINS_KEY, null);

  if (_cache.products.length === 0 && localProducts.length > 0) {
    for (var i = 0; i < localProducts.length; i++) {
      await db.collection('products').doc(localProducts[i].id).set(localProducts[i]);
    }
    _cache.products = localProducts;
  }
  if (_cache.orders.length === 0 && localOrders.length > 0) {
    for (var i = 0; i < localOrders.length; i++) {
      await db.collection('orders').doc(localOrders[i].id).set(localOrders[i]);
    }
    _cache.orders = localOrders;
  }
  if (_cache.contacts.length === 0 && localContacts.length > 0) {
    for (var i = 0; i < localContacts.length; i++) {
      await db.collection('contacts').doc(localContacts[i].id).set(localContacts[i]);
    }
    _cache.contacts = localContacts;
  }
  if (_cache.admins.length === 0 && localAdmins) {
    for (var i = 0; i < localAdmins.length; i++) {
      await db.collection('admins').doc(localAdmins[i].id).set(localAdmins[i]);
    }
    _cache.admins = localAdmins;
  }

  localStorage.removeItem(PRODUCTS_KEY);
  localStorage.removeItem(ORDERS_KEY);
  localStorage.removeItem(CONTACTS_KEY);
  localStorage.removeItem(ADMINS_KEY);
}

function getLocal(key, fallback) {
  try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch (e) { return fallback; }
}

function getProducts() { return _cache.products; }
function getOrders() { return _cache.orders; }
function getAdmins() { return _cache.admins; }
function getContacts() { return _cache.contacts; }

async function saveProduct(product) {
  _cache.products.push(product);
  try { await db.collection('products').doc(product.id).set(product); } catch (e) { console.error(e); }
}

async function updateProduct(id, data) {
  var idx = _cache.products.findIndex(function (p) { return p.id === id; });
  if (idx !== -1) {
    _cache.products[idx] = Object.assign({}, _cache.products[idx], data);
    try { await db.collection('products').doc(id).set(_cache.products[idx]); } catch (e) { console.error(e); }
  }
}

async function deleteProduct(id) {
  _cache.products = _cache.products.filter(function (p) { return p.id !== id; });
  try { await db.collection('products').doc(id).delete(); } catch (e) { console.error(e); }
}

async function placeOrder(order) {
  _cache.orders.unshift(order);
  try { await db.collection('orders').doc(order.id).set(order); } catch (e) { console.error(e); }
}

async function updateOrderStatus(orderId, status) {
  var o = _cache.orders.find(function (x) { return x.id === orderId; });
  if (o) {
    o.status = status;
    try { await db.collection('orders').doc(orderId).set(o); } catch (e) { console.error(e); }
  }
}

async function deleteOrder(orderId) {
  _cache.orders = _cache.orders.filter(function (o) { return o.id !== orderId; });
  try { await db.collection('orders').doc(orderId).delete(); } catch (e) { console.error(e); }
}

async function addAdmin(admin) {
  _cache.admins.push(admin);
  try { await db.collection('admins').doc(admin.id).set(admin); } catch (e) { console.error(e); }
}

async function updateAdmin(id, data) {
  var idx = _cache.admins.findIndex(function (a) { return a.id === id; });
  if (idx !== -1) {
    _cache.admins[idx] = Object.assign({}, _cache.admins[idx], data);
    try { await db.collection('admins').doc(id).set(_cache.admins[idx]); } catch (e) { console.error(e); }
  }
}

async function deleteAdmin(id) {
  _cache.admins = _cache.admins.filter(function (a) { return a.id !== id; });
  try { await db.collection('admins').doc(id).delete(); } catch (e) { console.error(e); }
}

async function updateAdminLastSeen(email) {
  var a = _cache.admins.find(function (x) { return x.email === email; });
  if (a) {
    a.lastSeen = new Date().toISOString();
    a.status = 'online';
    try { await db.collection('admins').doc(a.id).set(a); } catch (e) { console.error(e); }
  }
}

async function setAdminOffline(email) {
  var a = _cache.admins.find(function (x) { return x.email === email; });
  if (a) {
    a.status = 'offline';
    a.lastSeen = new Date().toISOString();
    try { await db.collection('admins').doc(a.id).set(a); } catch (e) { console.error(e); }
  }
}

async function authenticateAdmin(email, password) {
  try {
    var cred = await auth.signInWithEmailAndPassword(email, password);
    var user = cred.user;
    var admin = _cache.admins.find(function (a) { return a.email === email; });
    if (admin) {
      admin.uid = user.uid;
      return admin;
    }
    var adminObj = { id: user.uid, email: email, displayName: email.split('@')[0], status: 'online', lastSeen: new Date().toISOString() };
    _cache.admins.push(adminObj);
    try { await db.collection('admins').doc(user.uid).set(adminObj); } catch (e) { console.error(e); }
    return adminObj;
  } catch (e) {
    console.error('Auth failed:', e.code);
    return null;
  }
}

async function createAdminAuth(email, password, displayName) {
  try {
    var cred = await auth.createUserWithEmailAndPassword(email, password);
    var user = cred.user;
    var admin = { id: user.uid, email: email, displayName: displayName, status: 'offline', lastSeen: new Date().toISOString() };
    _cache.admins.push(admin);
    try { await db.collection('admins').doc(user.uid).set(admin); } catch (e) { console.error(e); }
    return admin;
  } catch (e) {
    console.error('Create admin failed:', e.code);
    return null;
  }
}

async function saveContact(contact) {
  _cache.contacts.unshift(contact);
  try { await db.collection('contacts').doc(contact.id).set(contact); } catch (e) { console.error(e); }
}

async function deleteContact(id) {
  _cache.contacts = _cache.contacts.filter(function (c) { return c.id !== id; });
  try { await db.collection('contacts').doc(id).delete(); } catch (e) { console.error(e); }
}

function getCart() { return getLocal(CART_KEY, []); }
function saveCart(cart) { localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(product, size) {
  var cart = getCart();
  var existing = cart.find(function (item) { return item.id === product.id && item.size === size; });
  if (existing) { existing.qty += 1; } else { cart.push(Object.assign({}, product, { qty: 1, size: size || '' })); }
  saveCart(cart);
}

function removeFromCart(productId, size) {
  var cart = getCart();
  if (size !== undefined && size !== null) {
    cart = cart.filter(function (item) { return !(item.id === productId && (item.size || '') === (size || '')); });
  } else {
    cart = cart.filter(function (item) { return item.id !== productId; });
  }
  saveCart(cart);
}

function updateCartQty(productId, size, qty) {
  var cart = getCart();
  var item = cart.find(function (x) { return x.id === productId && x.size === size; });
  if (item) {
    if (qty <= 0) return removeFromCart(productId, size);
    item.qty = qty;
    saveCart(cart);
  }
}

function clearCart() { saveCart([]); }
function getCartTotal() { return getCart().reduce(function (sum, item) { return sum + (parseFloat(item.price) * item.qty); }, 0); }
function getCartCount() { return getCart().reduce(function (sum, item) { return sum + item.qty; }, 0); }

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 5); }

function formatPrice(n) { return '\u20A6' + Number(n).toLocaleString(); }

function formatDate(iso) { return new Date(iso).toLocaleString(); }

function getSizesForCategory(category) { return category === 'Footwears' ? FOOTWEAR_SIZES : DEFAULT_SIZES; }

function getTotalStock(product) {
  if (product.sizes && typeof product.sizes === 'object') {
    var total = 0;
    for (var s in product.sizes) { if (product.sizes.hasOwnProperty(s)) total += Number(product.sizes[s]) || 0; }
    return total;
  }
  return Number(product.stock) || 0;
}

function getSizeStock(product, size) {
  if (product.sizes && typeof product.sizes === 'object') { return Number(product.sizes[size]) || 0; }
  if (product.stock !== undefined && (!size || size === '')) return Number(product.stock) || 0;
  return 0;
}

function decreaseSizeStock(product, size) {
  if (!product.sizes) product.sizes = {};
  var current = Number(product.sizes[size]) || 0;
  if (current > 0) product.sizes[size] = current - 1;
}

function uploadToCloudinary(file, done) {
  var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CONFIG.cloudName + '/image/upload';
  var fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      done(JSON.parse(xhr.responseText).secure_url);
    } else {
      try { var err = JSON.parse(xhr.responseText); alert('Upload failed: ' + (err.error.message || xhr.status)); } catch (e) { alert('Upload failed (status: ' + xhr.status + '). Check your Cloudinary upload preset name.'); }
      done(null);
    }
  };
  xhr.onerror = function () { alert('Network error during upload.'); done(null); };
  xhr.send(fd);
}
