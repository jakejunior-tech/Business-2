document.addEventListener('DOMContentLoaded', function () {

  var grid = document.getElementById('productsGrid');
  var filterBtns = document.querySelectorAll('.filter-btn');
  var subFilters = document.getElementById('subFilters');
  var subFilterBtns = document.querySelectorAll('.sub-filter-btn');

  var currentCategory = 'all';
  var currentSubcategory = null;

  var ALL_SUBCATEGORIES = ['Sneakers', 'Corporate Shoes', 'Palms', 'Palms Slippers'];

  function loadProducts() {
    var prods = getProducts();

    var filtered = [];
    if (currentCategory === 'all') {
      filtered = prods;
    } else if (currentSubcategory && currentCategory === 'Footwears') {
      for (var i = 0; i < prods.length; i++) {
        if (prods[i].subcategory === currentSubcategory) filtered.push(prods[i]);
      }
    } else {
      for (var i = 0; i < prods.length; i++) {
        if (prods[i].category === currentCategory) filtered.push(prods[i]);
      }
    }

    if (filtered.length === 0) {
      grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:60px 20px;color:#999;">No products found.</p>';
      return;
    }

    var html = '';
    for (var i = 0; i < filtered.length; i++) {
      var p = filtered[i];
      var totalStock = getTotalStock(p);
      var inStock = totalStock > 0;
      var sizes = getSizesForCategory(p.category);

      var sizeOpts = '<option value="">Select Size</option>';
      for (var j = 0; j < sizes.length; j++) {
        var s = p.sizes && p.sizes[sizes[j]] ? p.sizes[sizes[j]] : 0;
        if (s > 0) {
          sizeOpts += '<option value="' + sizes[j] + '">' + sizes[j] + ' (' + s + ')</option>';
        }
      }

      html +=
        '<div class="product-card">' +
          '<div class="product-image-wrap">' +
            (p.image ? '<img class="product-image" src="' + p.image + '" alt="' + p.name + '">' : '<span class="no-img">No Image</span>') +
          '</div>' +
          '<div class="product-info">' +
            '<div class="product-category">' + p.category + (p.subcategory ? ' / ' + p.subcategory : '') + '</div>' +
            '<div class="product-name">' + p.name + '</div>' +
            '<div class="product-price">' + formatPrice(p.price) + '</div>' +
            '<div class="product-stock' + (inStock ? '' : ' out') + '">' + (inStock ? totalStock + ' in stock' : 'Out of stock') + '</div>' +
            '<select class="product-size-select" id="size-' + p.id + '">' + sizeOpts + '</select>' +
            '<button class="btn-primary" ' + (inStock ? '' : 'disabled') + ' onclick="window.addToCartHandler(\'' + p.id + '\')">' +
              (inStock ? 'Add to Cart' : 'Sold Out') +
            '</button>' +
          '</div>' +
        '</div>';
    }

    grid.innerHTML = html;
  }

  window.addToCartHandler = function (id) {
    var prods = getProducts();
    var product = null;
    for (var i = 0; i < prods.length; i++) {
      if (prods[i].id === id) { product = prods[i]; break; }
    }
    if (!product) return;

    var totalStock = getTotalStock(product);
    if (totalStock <= 0) return;

    var sizeSelect = document.getElementById('size-' + id);
    var size = sizeSelect ? sizeSelect.value : '';

    if (!size) {
      alert('Please select a size');
      if (sizeSelect) sizeSelect.focus();
      return;
    }

    var sizeStock = getSizeStock(product, size);
    if (sizeStock <= 0) {
      alert('This size is out of stock');
      return;
    }

    addToCart(product, size);

    var prodsAfter = getProducts();
    var p = null;
    for (var i = 0; i < prodsAfter.length; i++) {
      if (prodsAfter[i].id === id) { p = prodsAfter[i]; break; }
    }
    if (p) {
      decreaseSizeStock(p, size);
      updateProduct(id, { sizes: p.sizes });
    }

    loadProducts();
    if (typeof updateCartCount === 'function') updateCartCount();
    if (typeof openCartDrawer === 'function') openCartDrawer();
  };

  for (var i = 0; i < filterBtns.length; i++) {
    filterBtns[i].addEventListener('click', function () {
      for (var j = 0; j < filterBtns.length; j++) filterBtns[j].classList.remove('active');
      this.classList.add('active');

      currentCategory = this.dataset.category;
      currentSubcategory = null;

      if (currentCategory === 'Footwears') {
        subFilters.classList.add('show');
        var first = subFilters.querySelector('.sub-filter-btn');
        if (first) {
          for (var k = 0; k < subFilterBtns.length; k++) subFilterBtns[k].classList.remove('active');
          first.classList.add('active');
          currentSubcategory = first.dataset.subcategory;
        }
      } else {
        subFilters.classList.remove('show');
      }

      loadProducts();
    });
  }

  for (var i = 0; i < subFilterBtns.length; i++) {
    subFilterBtns[i].addEventListener('click', function () {
      for (var j = 0; j < subFilterBtns.length; j++) subFilterBtns[j].classList.remove('active');
      this.classList.add('active');
      currentSubcategory = this.dataset.subcategory;
      loadProducts();
    });
  }

  dbReady.then(function () {
    loadProducts();
  });
});
