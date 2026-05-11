document.addEventListener('DOMContentLoaded', function () {

  if (!sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin-login.html';
    return;
  }

  var currentAdmin = sessionStorage.getItem('adminLoggedIn');
  document.getElementById('adminNameDisplay').textContent = 'Welcome, ' + currentAdmin;

  var isSuperAdmin = currentAdmin === 'Nengi' || currentAdmin === 'Kufre';
  var isOwner = currentAdmin === 'Nengi';
  var editingProductId = null;

  function uploadToCloudinary(file, done) {
    var url = 'https://api.cloudinary.com/v1_1/de7fyrtxe/image/upload';
    var fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', 'business_2');
    var xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.onload = function () {
      if (xhr.status === 200) {
        done(JSON.parse(xhr.responseText).secure_url);
      } else {
        alert('Image upload failed. Please try again.');
        done(null);
      }
    };
    xhr.onerror = function () { alert('Network error during upload.'); done(null); };
    xhr.send(fd);
  }

  document.getElementById('logoutBtn').addEventListener('click', function () {
    setAdminOffline(currentAdmin);
    sessionStorage.removeItem('adminLoggedIn');
    window.location.href = 'admin-login.html';
  });

  function renderSizeGrid(containerId, category, existingSizes) {
    var container = document.getElementById(containerId);
    if (!container) return;
    existingSizes = existingSizes || {};

    var sizes = getSizesForCategory(category);
    var html = '';
    for (var i = 0; i < sizes.length; i++) {
      var s = sizes[i];
      var val = existingSizes[s] || 0;
      html +=
        '<div class="size-input-group">' +
          '<label>' + s + '</label>' +
          '<input type="number" class="size-qty" data-size="' + s + '" value="' + val + '" min="0">' +
        '</div>';
    }
    container.innerHTML = html;
  }

  function getSizeDataFromGrid(containerId) {
    var container = document.getElementById(containerId);
    if (!container) return {};
    var inputs = container.querySelectorAll('.size-qty');
    var sizes = {};
    for (var i = 0; i < inputs.length; i++) {
      var val = parseInt(inputs[i].value) || 0;
      if (val > 0) sizes[inputs[i].dataset.size] = val;
    }
    return sizes;
  }

  document.getElementById('prodImage').addEventListener('change', function () {
    var preview = document.getElementById('prodImagePreview');
    var file = this.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (e) { preview.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(file);
    } else {
      preview.style.display = 'none';
    }
  });

  document.getElementById('prodCategory').addEventListener('change', function () {
    var group = document.getElementById('subcategoryGroup');
    group.style.display = this.value === 'Footwears' ? 'block' : 'none';
    renderSizeGrid('prodSizesContainer', this.value, null);
  });

  document.getElementById('editCategory').addEventListener('change', function () {
    var group = document.getElementById('editSubcategoryGroup');
    group.style.display = this.value === 'Footwears' ? 'block' : 'none';

    var container = document.getElementById('editSizesContainer');
    var existingInputs = container.querySelectorAll('.size-qty');
    var existing = {};
    for (var i = 0; i < existingInputs.length; i++) {
      existing[existingInputs[i].dataset.size] = parseInt(existingInputs[i].value) || 0;
    }
    renderSizeGrid('editSizesContainer', this.value, existing);
  });

  var editModal = document.getElementById('editModal');

  function openEditModal(product) {
    editingProductId = product.id;
    document.getElementById('editPrice').value = product.price;
    document.getElementById('editCategory').value = product.category;

    var subGroup = document.getElementById('editSubcategoryGroup');
    var subSelect = document.getElementById('editSubcategory');
    if (product.category === 'Footwears') {
      subGroup.style.display = 'block';
      subSelect.value = product.subcategory || '';
    } else {
      subGroup.style.display = 'none';
      subSelect.value = '';
    }

    renderSizeGrid('editSizesContainer', product.category, product.sizes || {});
    editModal.classList.add('show');
  }

  function closeEditModal() {
    editModal.classList.remove('show');
    editingProductId = null;
  }

  document.getElementById('editModalClose').addEventListener('click', closeEditModal);
  editModal.addEventListener('click', function (e) {
    if (e.target === editModal) closeEditModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeEditModal(); closeEditAdminModal(); }
  });

  document.getElementById('editProductForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!editingProductId) return;

    var data = {
      price: parseFloat(document.getElementById('editPrice').value),
      category: document.getElementById('editCategory').value
    };

    if (data.category === 'Footwears') {
      data.subcategory = document.getElementById('editSubcategory').value || '';
    } else {
      data.subcategory = '';
    }

    data.sizes = getSizeDataFromGrid('editSizesContainer');

    var imgFile = document.getElementById('editImage').files[0];
    function saveEdit(imgUrl) {
      if (imgUrl) data.image = imgUrl;
      updateProduct(editingProductId, data);
      closeEditModal();
      loadAllProducts();
    }
    if (imgFile) {
      uploadToCloudinary(imgFile, saveEdit);
    } else {
      saveEdit(null);
    }
  });

  document.getElementById('addProductForm').addEventListener('submit', function (e) {
    e.preventDefault();

    var price = parseFloat(document.getElementById('prodPrice').value);
    var category = document.getElementById('prodCategory').value;

    if (!price || !category) {
      alert('Please fill in all required fields.');
      return;
    }

    var subcategory = category === 'Footwears' ? document.getElementById('prodSubcategory').value : '';
    var sizes = getSizeDataFromGrid('prodSizesContainer');

    var totalStock = 0;
    for (var s in sizes) {
      if (sizes.hasOwnProperty(s)) totalStock += sizes[s];
    }

    if (totalStock === 0) {
      alert('Please add at least one size with quantity.');
      return;
    }

    var product = {
      id: generateId(),
      name: category + (subcategory ? ' - ' + subcategory : ''),
      price: price,
      category: category,
      subcategory: subcategory,
      sizes: sizes,
      image: '',
      createdAt: new Date().toISOString()
    };

    var imgFile = document.getElementById('prodImage').files[0];
    var form = this;

    function saveAndReset(imgUrl) {
      if (imgUrl) product.image = imgUrl;
      saveProduct(product);
      form.reset();
      document.getElementById('prodImagePreview').style.display = 'none';
      document.getElementById('subcategoryGroup').style.display = 'none';
      document.getElementById('prodSizesContainer').innerHTML = '';
      loadAllProducts();
      loadStats();
      alert('Product added successfully!');
    }

    if (imgFile) {
      uploadToCloudinary(imgFile, saveAndReset);
    } else {
      saveAndReset(null);
    }
  });

  function loadStats() {
    var prods = getProducts();
    var orders = getOrders();
    var admins = getAdmins();
    var contacts = getContacts();

    document.getElementById('adminStats').innerHTML =
      '<div class="stat-card"><div class="stat-num">' + prods.length + '</div><div class="stat-label">Total Products</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + orders.length + '</div><div class="stat-label">Total Orders</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + admins.filter(function(a){return a.status==='online'}).length + ' / ' + admins.length + '</div><div class="stat-label">Admins Online</div></div>' +
      '<div class="stat-card"><div class="stat-num">' + contacts.length + '</div><div class="stat-label">Reports</div></div>';
  }

  function loadAllProducts() {
    var prods = getProducts();
    var tbody = document.getElementById('productsTableBody');

    if (prods.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px;">No products yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < prods.length; i++) {
      var p = prods[i];
      var sizesStr = '';
      if (p.sizes && typeof p.sizes === 'object') {
        var parts = [];
        for (var s in p.sizes) {
          if (p.sizes.hasOwnProperty(s) && p.sizes[s] > 0) {
            parts.push(s + '(' + p.sizes[s] + ')');
          }
        }
        sizesStr = parts.join(', ') || 'No stock';
      } else {
        sizesStr = String(p.stock || 0);
      }

      html +=
        '<tr>' +
          '<td>' + (p.image ? '<img src="' + p.image + '" alt="">' : '<span class="no-img-text">No img</span>') + '</td>' +
          '<td>' + formatPrice(p.price) + '</td>' +
          '<td>' + p.category + (p.subcategory ? ' / ' + p.subcategory : '') + '</td>' +
          '<td class="cell-sizes">' + sizesStr + '</td>' +
          '<td class="cell-actions">' +
            '<button class="edit-btn" onclick="window.editProduct(\'' + p.id + '\')">Edit</button> ' +
            '<button class="delete-btn" onclick="window.deleteProductHandler(\'' + p.id + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  window.editProduct = function (id) {
    var prods = getProducts();
    var p = null;
    for (var i = 0; i < prods.length; i++) {
      if (prods[i].id === id) { p = prods[i]; break; }
    }
    if (p) openEditModal(p);
  };

  window.deleteProductHandler = function (id) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    deleteProduct(id);
    loadAllProducts();
    loadStats();
  };

  function loadOrders() {
    var orders = getOrders();
    var tbody = document.getElementById('ordersTableBody');

    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:24px;">No orders yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      var itemsStr = '';
      for (var j = 0; j < o.items.length; j++) {
        var it = o.items[j];
        itemsStr += it.name + (it.size ? ' (' + it.size + ')' : '') + ' x' + it.qty + ', ';
      }
      itemsStr = itemsStr.replace(/, $/, '');

      html +=
        '<tr>' +
          '<td class="cell-date">' + formatDate(o.createdAt) + '</td>' +
          '<td class="cell-customer"><strong>' + o.customer.name + '</strong><br><small>' + o.customer.phone + '<br>' + o.customer.email + '</small></td>' +
          '<td class="cell-items">' + itemsStr + '</td>' +
          '<td class="cell-total">' + formatPrice(o.total) + '</td>' +
          '<td class="cell-status"><span class="status-badge ' + o.status + '">' + o.status + '</span></td>' +
          '<td class="cell-receipt">' + (o.receipt ? '<img class="receipt-thumb" src="' + o.receipt + '" alt="Receipt" onclick="window.viewReceipt(\'' + o.id + '\')">' : '<span style="color:#999;">None</span>') + '</td>' +
          '<td class="cell-actions">' +
            '<select class="status-select" onchange="window.changeOrderStatus(\'' + o.id + '\', this.value)">' +
              '<option value="pending"' + (o.status === 'pending' ? ' selected' : '') + '>Pending</option>' +
              '<option value="confirmed"' + (o.status === 'confirmed' ? ' selected' : '') + '>Confirmed</option>' +
              '<option value="delivered"' + (o.status === 'delivered' ? ' selected' : '') + '>Delivered</option>' +
            '</select><br>' +
            '<button class="delete-btn" style="margin-top:4px;" onclick="window.deleteOrderHandler(\'' + o.id + '\')">Delete</button>' +
          '</td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  window.viewReceipt = function (orderId) {
    var orders = getOrders();
    var o = null;
    for (var i = 0; i < orders.length; i++) {
      if (orders[i].id === orderId) { o = orders[i]; break; }
    }
    if (o && o.receipt) {
      document.getElementById('receiptModalImg').src = o.receipt;
      document.getElementById('receiptModal').classList.add('show');
    }
  };

  document.getElementById('receiptModalClose').addEventListener('click', function () {
    document.getElementById('receiptModal').classList.remove('show');
  });

  document.getElementById('receiptModal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('show');
  });

  window.changeOrderStatus = function (orderId, status) {
    updateOrderStatus(orderId, status);
    loadOrders();
  };

  window.deleteOrderHandler = function (orderId) {
    if (!confirm('Delete this order?')) return;
    deleteOrder(orderId);
    loadOrders();
    loadStats();
  };

  function loadAdmins() {
    var admins = getAdmins();
    var tbody = document.getElementById('adminsTableBody');
    var html = '';
    for (var i = 0; i < admins.length; i++) {
      var a = admins[i];
      html +=
        '<tr>' +
          '<td><strong>' + a.username + '</strong></td>' +
          '<td><span class="status-badge ' + a.status + '">' + a.status + '</span></td>' +
          '<td>' + formatDate(a.lastSeen) + '</td>' +
          (isSuperAdmin ? (
            '<td class="cell-actions">' +
              '<button class="edit-btn" onclick="window.editAdminHandler(\'' + a.id + '\')">Edit</button> ' +
              (isOwner && a.username !== currentAdmin ? '<button class="delete-btn" onclick="window.deleteAdminHandler(\'' + a.id + '\')">Delete</button>' : '') +
            '</td>'
          ) : '<td></td>') +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  if (!isSuperAdmin) {
    document.getElementById('adminsActionsHeader').style.display = 'none';
  }

  document.getElementById('addAdminForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var username = document.getElementById('newAdminUsername').value.trim();
    var password = document.getElementById('newAdminPassword').value.trim();

    if (!username || !password) {
      alert('Please fill in all fields.');
      return;
    }

    var admins = getAdmins();
    for (var i = 0; i < admins.length; i++) {
      if (admins[i].username.toLowerCase() === username.toLowerCase()) {
        alert('Username already exists. Please choose a different one.');
        return;
      }
    }

    addAdmin({
      id: generateId(),
      username: username,
      password: password,
      status: 'offline',
      lastSeen: new Date().toISOString()
    });

    this.reset();
    loadAdmins();
    loadStats();
    alert('Admin added successfully!');
  });

  var editAdminModal = document.getElementById('editAdminModal');
  var editingAdminId = null;

  window.editAdminHandler = function (id) {
    if (!isSuperAdmin) return;
    var admins = getAdmins();
    var admin = null;
    for (var i = 0; i < admins.length; i++) {
      if (admins[i].id === id) { admin = admins[i]; break; }
    }
    if (!admin) return;
    editingAdminId = id;
    document.getElementById('editAdminUsername').value = admin.username;
    document.getElementById('editAdminPassword').value = '';
    editAdminModal.classList.add('show');
  };

  function closeEditAdminModal() {
    editAdminModal.classList.remove('show');
    editingAdminId = null;
  }

  document.getElementById('editAdminModalClose').addEventListener('click', closeEditAdminModal);
  editAdminModal.addEventListener('click', function (e) {
    if (e.target === editAdminModal) closeEditAdminModal();
  });

  document.getElementById('editAdminForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!isSuperAdmin || !editingAdminId) return;

    var newUsername = document.getElementById('editAdminUsername').value.trim();
    var newPassword = document.getElementById('editAdminPassword').value.trim();

    if (!newUsername) {
      alert('Username cannot be empty.');
      return;
    }

    var admins = getAdmins();
    var oldAdmin = null;
    for (var i = 0; i < admins.length; i++) {
      if (admins[i].id === editingAdminId) { oldAdmin = admins[i]; }
      if (admins[i].id !== editingAdminId && admins[i].username.toLowerCase() === newUsername.toLowerCase()) {
        alert('Username already exists. Please choose a different one.');
        return;
      }
    }

    var data = { username: newUsername };
    if (newPassword) {
      data.password = newPassword;
    }

    updateAdmin(editingAdminId, data);

    var isEditingSelf = oldAdmin && oldAdmin.username === currentAdmin;
    if (isEditingSelf) {
      sessionStorage.setItem('adminLoggedIn', newUsername);
      currentAdmin = newUsername;
      document.getElementById('adminNameDisplay').textContent = 'Welcome, ' + newUsername;
    }

    closeEditAdminModal();
    loadAdmins();
    alert('Admin updated successfully!');
  });

  window.deleteAdminHandler = function (id) {
    if (!isOwner) return;
    if (!confirm('Are you sure you want to delete this admin?')) return;
    deleteAdmin(id);
    loadAdmins();
    loadStats();
  };

  function loadReports() {
    var contacts = getContacts();
    var tbody = document.getElementById('reportsTableBody');

    if (contacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:24px;">No reports yet.</td></tr>';
      return;
    }

    var html = '';
    for (var i = 0; i < contacts.length; i++) {
      var c = contacts[i];
      html +=
        '<tr>' +
          '<td class="cell-date">' + formatDate(c.createdAt) + '</td>' +
          '<td><strong>' + c.name + '</strong></td>' +
          '<td class="cell-email">' + c.email + '</td>' +
          '<td class="cell-message">' + c.message + '</td>' +
          '<td class="cell-actions"><button class="delete-btn" onclick="window.deleteReportHandler(\'' + c.id + '\')">Delete</button></td>' +
        '</tr>';
    }
    tbody.innerHTML = html;
  }

  function loadReceipts() {
    var orders = getOrders();
    var gallery = document.getElementById('receiptGallery');
    var items = [];
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      if (o.receipt) {
        items.push({ orderId: o.id, receipt: o.receipt, customer: o.customer.name, date: o.createdAt });
      }
    }
    if (items.length === 0) {
      gallery.innerHTML = '<p style="color:#999;text-align:center;padding:24px;">No receipts yet.</p>';
      return;
    }
    var html = '';
    for (var i = 0; i < items.length; i++) {
      html +=
        '<div class="receipt-gallery-item" onclick="window.viewReceipt(\'' + items[i].orderId + '\')">' +
          '<img src="' + items[i].receipt + '" alt="Receipt">' +
          '<div class="receipt-info">' + items[i].customer + ' &middot; ' + formatDate(items[i].date) + '</div>' +
        '</div>';
    }
    gallery.innerHTML = html;
  }

  window.deleteReportHandler = function (id) {
    if (!confirm('Delete this report?')) return;
    deleteContact(id);
    loadReports();
    loadStats();
  };

  var tabBtns = document.querySelectorAll('.tab-btn');
  for (var i = 0; i < tabBtns.length; i++) {
    tabBtns[i].addEventListener('click', function () {
      for (var j = 0; j < tabBtns.length; j++) tabBtns[j].classList.remove('active');
      this.classList.add('active');
      var sections = document.querySelectorAll('.admin-section');
      for (var k = 0; k < sections.length; k++) sections[k].classList.remove('active');
      document.getElementById(this.dataset.tab).classList.add('active');
    });
  }

  loadStats();
  loadAllProducts();
  loadOrders();
  loadAdmins();
  loadReports();
  loadReceipts();
});
