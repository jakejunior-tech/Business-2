function openCartDrawer() {
  var drawer = document.getElementById('cartDrawer');
  var overlay = document.getElementById('overlay');
  if (drawer) {
    drawer.classList.add('open');
    drawer.style.transform = 'translateX(0)';
  }
  if (overlay) {
    overlay.classList.add('active');
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
  }
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
}

function closeCartDrawer() {
  var drawer = document.getElementById('cartDrawer');
  var overlay = document.getElementById('overlay');
  if (drawer) {
    drawer.classList.remove('open');
    drawer.style.transform = '';
  }
  if (overlay) {
    overlay.classList.remove('active');
    overlay.style.opacity = '';
    overlay.style.visibility = '';
  }
  document.body.style.overflow = '';
}

function updateCartCount() {
  var count = getCartCount();
  var els = document.querySelectorAll('.cart-count');
  for (var i = 0; i < els.length; i++) {
    els[i].textContent = count;
  }
}

function renderCartDrawer() {
  var container = document.getElementById('cartDrawerContent');
  var totalEl = document.getElementById('cartTotal');
  if (!container) return;

  var cart = getCart();
  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty-msg">Your cart is empty.</div>';
    if (totalEl) totalEl.textContent = '\u20A60';
    updateCartCount();
    return;
  }

  var html = '';
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var imgSrc = item.image || '';
    var sizeText = item.size ? 'Size: ' + item.size : '';
    html +=
      '<div class="cart-item">' +
        '<img class="cart-item-img" src="' + imgSrc + '" alt="' + item.name + '" onerror="this.style.display=\'none\'">' +
        '<div class="cart-item-info">' +
          '<div class="cart-item-name">' + item.name + '</div>' +
          '<div class="cart-item-size">' + sizeText + '</div>' +
          '<div class="cart-item-price">' + formatPrice(item.price) + '</div>' +
        '</div>' +
        '<div class="cart-item-actions">' +
          '<div class="qty-controls">' +
            '<button class="qty-btn" onclick="qtyDec(\'' + item.id + '\',\'' + (item.size || '') + '\')">-</button>' +
            '<span>' + item.qty + '</span>' +
            '<button class="qty-btn" onclick="qtyInc(\'' + item.id + '\',\'' + (item.size || '') + '\')">+</button>' +
          '</div>' +
          '<button class="remove-item" onclick="removeCartItem(\'' + item.id + '\',\'' + (item.size || '') + '\')">Remove</button>' +
        '</div>' +
      '</div>';
  }

  container.innerHTML = html;
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
  updateCartCount();
}

function qtyDec(id, size) {
  var cart = getCart();
  var s1 = size || '';
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id && (cart[i].size || '') === s1) {
      item = cart[i];
      break;
    }
  }
  if (item && item.qty > 1) {
    updateCartQty(id, size, item.qty - 1);
  } else {
    removeFromCart(id, size);
  }
  renderCartDrawer();
}

function qtyInc(id, size) {
  var cart = getCart();
  var s1 = size || '';
  var item = null;
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].id === id && (cart[i].size || '') === s1) {
      item = cart[i];
      break;
    }
  }
  if (item) {
    updateCartQty(id, size, item.qty + 1);
    renderCartDrawer();
  }
}

function removeCartItem(id, size) {
  removeFromCart(id, size);
  renderCartDrawer();
  if (typeof loadProducts === 'function') loadProducts();
}

document.addEventListener('DOMContentLoaded', function () {

  updateCartCount();

  var menuBtn = document.getElementById('mobileMenuBtn');
  var nav = document.querySelector('.nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menuBtn.classList.toggle('active');
      nav.classList.toggle('active');
    });
    nav.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function () {
        menuBtn.classList.remove('active');
        nav.classList.remove('active');
      });
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        menuBtn.classList.remove('active');
        nav.classList.remove('active');
      }
    });
  }

  var adminIndicator = document.getElementById('adminIndicator');
  if (adminIndicator) {
    var adminUser = sessionStorage.getItem('adminLoggedIn');
    if (adminUser) {
      adminIndicator.textContent = adminUser;
      adminIndicator.classList.add('show');
    }
  }

  var cartIcon = document.getElementById('cartIcon');
  if (cartIcon) {
    cartIcon.addEventListener('click', function () {
      openCartDrawer();
    });
  }

  var closeBtn = document.getElementById('closeCart');
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  var overlay = document.getElementById('overlay');
  if (overlay) overlay.addEventListener('click', closeCartDrawer);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCartDrawer();
  });
});
