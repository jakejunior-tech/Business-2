document.addEventListener('DOMContentLoaded', function () {

  const summaryBox = document.getElementById('checkoutSummary');
  const viewPaymentBtn = document.getElementById('viewPaymentBtn');
  const paymentBox = document.getElementById('paymentBox');
  const sendBtn = document.getElementById('sendOrderBtn');
  const confirmation = document.getElementById('orderConfirmation');

  const NENGI_WA = '2348145173339';
  const KUFRE_WA = '2348051426659';

  function renderSummary() {
    const cart = getCart();
    if (cart.length === 0) {
      summaryBox.innerHTML = '<p style="text-align:center;color:#999;">Your cart is empty. <a href="index.html" style="color:var(--accent);font-weight:600;">Shop now</a></p>';
      if (sendBtn) sendBtn.disabled = true;
      return;
    }

    let html = '';
    cart.forEach(item => {
      html += `
        <div class="order-summary-item">
          <span>${item.name}${item.size ? ' (' + item.size + ')' : ''} x${item.qty}</span>
          <span>${formatPrice(item.price * item.qty)}</span>
        </div>
      `;
    });
    html += `<div class="order-total-line"><span>Total</span><span>${formatPrice(getCartTotal())}</span></div>`;
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
      const name = document.getElementById('custName').value.trim();
      const phone = document.getElementById('custPhone').value.trim();
      const email = document.getElementById('custEmail').value.trim();
      const address = document.getElementById('custAddress').value.trim();
      const receiptFile = document.getElementById('receiptUpload').files[0];

      if (!name || !phone || !email || !address) {
        alert('Please fill in all delivery details.');
        return;
      }

      const cart = getCart();
      if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
      }

      function proceedOrder(receiptBase64) {
        const order = {
          id: generateId(),
          customer: { name, phone, email, address },
          items: cart,
          total: getCartTotal(),
          status: 'pending',
          receipt: receiptBase64 || '',
          createdAt: new Date().toISOString()
        };

        placeOrder(order);
        clearCart();
        if (typeof updateCartCount === 'function') updateCartCount();

        const itemsStr = cart.map(i => `${i.name}${i.size ? ' (' + i.size + ')' : ''} x${i.qty} - ${formatPrice(i.price * i.qty)}`).join('%0a');
        const msg = `NEW ORDER from ${name}%0a%0aItems:%0a${itemsStr}%0a%0aTotal: ${formatPrice(order.total)}%0aPhone: ${phone}%0aEmail: ${email}%0aAddress: ${address}%0a%0aReceipt uploaded to admin panel. Please check.`;

        window.open(`https://wa.me/${NENGI_WA}?text=${msg}`, '_blank');
        window.open(`https://wa.me/${KUFRE_WA}?text=${msg}`, '_blank');

        if (confirmation) confirmation.classList.add('show');
        if (summaryBox) summaryBox.innerHTML = '';
        sendBtn.disabled = true;
        sendBtn.textContent = 'Order Sent!';
      }

      if (receiptFile) {
        const reader = new FileReader();
        reader.onload = function (e) { proceedOrder(e.target.result); };
        reader.readAsDataURL(receiptFile);
      } else {
        proceedOrder('');
      }
    });
  }

  renderSummary();
});
