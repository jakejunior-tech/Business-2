document.addEventListener('DOMContentLoaded', function () {

  var summaryBox = document.getElementById('checkoutSummary');
  var viewPaymentBtn = document.getElementById('viewPaymentBtn');
  var paymentBox = document.getElementById('paymentBox');
  var sendBtn = document.getElementById('sendOrderBtn');
  var confirmation = document.getElementById('orderConfirmation');

  var NENGI_WA = '2348145173339';
  var KUFRE_WA = '2348051426659';

  function renderSummary() {
    var cart = getCart();
    if (cart.length === 0) {
      summaryBox.innerHTML = '<p style="text-align:center;color:#999;">Your cart is empty. <a href="index.html" style="color:var(--accent);font-weight:600;">Shop now</a></p>';
      if (sendBtn) sendBtn.disabled = true;
      return;
    }

    var html = '';
    for (var i = 0; i < cart.length; i++) {
      var item = cart[i];
      html +=
        '<div class="order-summary-item">' +
          '<span>' + item.name + (item.size ? ' (' + item.size + ')' : '') + ' x' + item.qty + '</span>' +
          '<span>' + formatPrice(item.price * item.qty) + '</span>' +
        '</div>';
    }
    html += '<div class="order-total-line"><span>Total</span><span>' + formatPrice(getCartTotal()) + '</span></div>';
    summaryBox.innerHTML = html;
    if (sendBtn) sendBtn.disabled = false;
  }

  if (viewPaymentBtn && paymentBox) {
    viewPaymentBtn.addEventListener('click', function () {
      paymentBox.classList.toggle('show');
      this.textContent = paymentBox.classList.contains('show')
        ? 'Hide Payment Details'
        : 'View Payment Details';
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', function () {
      var name = document.getElementById('custName').value.trim();
      var phone = document.getElementById('custPhone').value.trim();
      var email = document.getElementById('custEmail').value.trim();
      var address = document.getElementById('custAddress').value.trim();
      var receiptFile = document.getElementById('receiptUpload').files[0];

      if (!name || !phone || !email || !address) {
        alert('Please fill in all delivery details.');
        return;
      }

      var cart = getCart();
      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      function proceedOrder(receiptUrl) {
        var order = {
          id: generateId(),
          customer: { name: name, phone: phone, email: email, address: address },
          items: cart,
          total: getCartTotal(),
          status: 'pending',
          receipt: receiptUrl || '',
          createdAt: new Date().toISOString()
        };

        placeOrder(order);
        clearCart();
        if (typeof updateCartCount === 'function') updateCartCount();

        var itemsStr = '';
        for (var i = 0; i < cart.length; i++) {
          var it = cart[i];
          itemsStr += it.name + (it.size ? ' (' + it.size + ')' : '') + ' x' + it.qty + ' - ' + formatPrice(it.price * it.qty) + '%0a';
        }
        var msg = 'NEW ORDER from ' + name + '%0a%0aItems:%0a' + itemsStr + '%0aTotal: ' + formatPrice(order.total) + '%0aPhone: ' + phone + '%0aEmail: ' + email + '%0aAddress: ' + address + '%0a%0aReceipt uploaded to admin panel. Please check.';

        window.open('https://wa.me/' + NENGI_WA + '?text=' + msg, '_blank');
        window.open('https://wa.me/' + KUFRE_WA + '?text=' + msg, '_blank');

        if (confirmation) confirmation.classList.add('show');
        if (summaryBox) summaryBox.innerHTML = '';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Order Sent!';
      }

      if (receiptFile) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Uploading receipt...';
        uploadToCloudinary(receiptFile, function (url) {
          proceedOrder(url);
        });
      } else {
        proceedOrder('');
      }
    });
  }

  renderSummary();
});
