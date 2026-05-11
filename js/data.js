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

// Sync init from localStorage (instant — no Firestore wait)
(function initCache() {
  _cache.products = getLocal(PRODUCTS_KEY, []);
  _cache.orders = getLocal(ORDERS_KEY, []);
  _cache.admins = getLocal(ADMINS_KEY, DEFAULT_ADMINS);
  _cache.contacts = getLocal(CONTACTS_KEY, []);
})();

// dbReady resolves instantly if localStorage had data, else waits for Firestore
var _hasLocalData = !!localStorage.getItem(PRODUCTS_KEY) || !!localStorage.getItem(ORDERS_KEY) || !!localStorage.getItem(ADMINS_KEY) || !!localStorage.getItem(CONTACTS_KEY);
var dbReady = _hasLocalData ? Promise.resolve() : syncFromFirestore();

// Always sync from Firestore in background (non-blocking)
if (_hasLocalData) { syncFromFirestore(); }

async function syncFromFirestore() {
  try {
    var snapshots = await Promise.all([
      db.collection('products').get(),
      db.collection('orders').get(),
      db.collection('admins').get(),
      db.collection('contacts').get()
    ]);
    var collections = [
      { snap: snapshots[0], key: PRODUCTS_KEY, cacheKey: 'products', col: 'products' },
      { snap: snapshots[1], key: ORDERS_KEY, cacheKey: 'orders', col: 'orders' },
      { snap: snapshots[2], key: ADMINS_KEY, cacheKey: 'admins', col: 'admins' },
      { snap: snapshots[3], key: CONTACTS_KEY, cacheKey: 'contacts', col: 'contacts' }
    ];
    for (var i = 0; i < collections.length; i++) {
      var c = collections[i];
      if (!c.snap.empty) {
        _cache[c.cacheKey] = c.snap.docs.map(function (d) { return d.data(); });
        persistLocal(c.key, _cache[c.cacheKey]);
      } else if (_cache[c.cacheKey].length > 0) {
        var localData = _cache[c.cacheKey];
        for (var j = 0; j < localData.length; j++) {
          await db.collection(c.col).doc(localData[j].id).set(localData[j]);
        }
      }
    }
  } catch (e) {
    console.error('Firestore sync failed (non-blocking):', e);
  }
}

function getLocal(key, fallback) {
  try { var d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch (e) { return fallback; }
}

function getProducts() { return _cache.products; }
function getOrders() { return _cache.orders; }
function getAdmins() { return _cache.admins; }
function getContacts() { return _cache.contacts; }

function persistLocal(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
}

function saveProduct(product) {
  _cache.products.push(product);
  persistLocal(PRODUCTS_KEY, _cache.products);
  db.collection('products').doc(product.id).set(product).catch(function (e) { console.error(e); });
}

function updateProduct(id, data) {
  var idx = _cache.products.findIndex(function (p) { return p.id === id; });
  if (idx !== -1) {
    _cache.products[idx] = Object.assign({}, _cache.products[idx], data);
    persistLocal(PRODUCTS_KEY, _cache.products);
    db.collection('products').doc(id).set(_cache.products[idx]).catch(function (e) { console.error(e); });
  }
}

function deleteProduct(id) {
  _cache.products = _cache.products.filter(function (p) { return p.id !== id; });
  persistLocal(PRODUCTS_KEY, _cache.products);
  db.collection('products').doc(id).delete().catch(function (e) { console.error(e); });
}

function placeOrder(order) {
  _cache.orders.unshift(order);
  persistLocal(ORDERS_KEY, _cache.orders);
  db.collection('orders').doc(order.id).set(order).catch(function (e) { console.error(e); });
}

function updateOrderStatus(orderId, status) {
  var o = _cache.orders.find(function (x) { return x.id === orderId; });
  if (o) {
    o.status = status;
    persistLocal(ORDERS_KEY, _cache.orders);
    db.collection('orders').doc(orderId).set(o).catch(function (e) { console.error(e); });
  }
}

function updateOrderReceipt(orderId, receiptUrl) {
  var o = _cache.orders.find(function (x) { return x.id === orderId; });
  if (o) {
    o.receipt = receiptUrl;
    persistLocal(ORDERS_KEY, _cache.orders);
    db.collection('orders').doc(orderId).set(o).catch(function (e) { console.error(e); });
  }
}

function deleteOrder(orderId) {
  _cache.orders = _cache.orders.filter(function (o) { return o.id !== orderId; });
  persistLocal(ORDERS_KEY, _cache.orders);
  db.collection('orders').doc(orderId).delete().catch(function (e) { console.error(e); });
}

function addAdmin(admin) {
  _cache.admins.push(admin);
  persistLocal(ADMINS_KEY, _cache.admins);
  db.collection('admins').doc(admin.id).set(admin).catch(function (e) { console.error(e); });
}

function updateAdmin(id, data) {
  var idx = _cache.admins.findIndex(function (a) { return a.id === id; });
  if (idx !== -1) {
    _cache.admins[idx] = Object.assign({}, _cache.admins[idx], data);
    persistLocal(ADMINS_KEY, _cache.admins);
    db.collection('admins').doc(id).set(_cache.admins[idx]).catch(function (e) { console.error(e); });
  }
}

function deleteAdmin(id) {
  _cache.admins = _cache.admins.filter(function (a) { return a.id !== id; });
  persistLocal(ADMINS_KEY, _cache.admins);
  db.collection('admins').doc(id).delete().catch(function (e) { console.error(e); });
}

function updateAdminLastSeen(email) {
  var a = _cache.admins.find(function (x) { return x.email === email; });
  if (a) {
    a.lastSeen = new Date().toISOString();
    a.status = 'online';
    persistLocal(ADMINS_KEY, _cache.admins);
    db.collection('admins').doc(a.id).set(a).catch(function (e) { console.error(e); });
  }
}

function setAdminOffline(email) {
  var a = _cache.admins.find(function (x) { return x.email === email; });
  if (a) {
    a.status = 'offline';
    a.lastSeen = new Date().toISOString();
    persistLocal(ADMINS_KEY, _cache.admins);
    db.collection('admins').doc(a.id).set(a).catch(function (e) { console.error(e); });
  }
}

function authenticateAdmin(email, password) {
  return auth.signInWithEmailAndPassword(email, password).then(function (cred) {
    var user = cred.user;
    var admin = _cache.admins.find(function (a) { return a.email === email; });
    if (admin) {
      admin.uid = user.uid;
      return admin;
    }
    var adminObj = { id: user.uid, email: email, displayName: email.split('@')[0], status: 'online', lastSeen: new Date().toISOString() };
    _cache.admins.push(adminObj);
    persistLocal(ADMINS_KEY, _cache.admins);
    db.collection('admins').doc(user.uid).set(adminObj).catch(function (e) { console.error(e); });
    return adminObj;
  }).catch(function (e) {
    console.error('Auth failed:', e.code);
    return null;
  });
}

function createAdminAuth(email, password, displayName) {
  return auth.createUserWithEmailAndPassword(email, password).then(function (cred) {
    var user = cred.user;
    var admin = { id: user.uid, email: email, displayName: displayName, status: 'offline', lastSeen: new Date().toISOString() };
    _cache.admins.push(admin);
    persistLocal(ADMINS_KEY, _cache.admins);
    db.collection('admins').doc(user.uid).set(admin).catch(function (e) { console.error(e); });
    return admin;
  }).catch(function (e) {
    console.error('Create admin failed:', e.code);
    return null;
  });
}

function saveContact(contact) {
  _cache.contacts.unshift(contact);
  persistLocal(CONTACTS_KEY, _cache.contacts);
  db.collection('contacts').doc(contact.id).set(contact).catch(function (e) { console.error(e); });
}

function deleteContact(id) {
  _cache.contacts = _cache.contacts.filter(function (c) { return c.id !== id; });
  persistLocal(CONTACTS_KEY, _cache.contacts);
  db.collection('contacts').doc(id).delete().catch(function (e) { console.error(e); });
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

function compressToBase64(file, maxWidth, quality, callback) {
  var reader = new FileReader();
  reader.onload = function (e) {
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement('canvas');
      var w = img.width;
      var h = img.height;
      if (w > maxWidth) {
        h = Math.round(h * maxWidth / w);
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(function (blob) {
        var r = new FileReader();
        r.onload = function () { callback(r.result, blob); };
        r.readAsDataURL(blob);
      }, 'image/jpeg', quality);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadToCloudinary(blob, done) {
  var url = 'https://api.cloudinary.com/v1_1/' + CLOUDINARY_CONFIG.cloudName + '/image/upload';
  var fd = new FormData();
  fd.append('file', blob, 'upload.jpg');
  fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
  var xhr = new XMLHttpRequest();
  xhr.open('POST', url, true);
  xhr.onload = function () {
    if (xhr.status === 200) {
      done(JSON.parse(xhr.responseText).secure_url);
    } else {
      done(null);
    }
  };
  xhr.onerror = function () { done(null); };
  xhr.send(fd);
}
