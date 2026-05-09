document.addEventListener('DOMContentLoaded', function () {

  const form = document.getElementById('contactForm');
  const success = document.getElementById('contactSuccess');

  const NENGI_WA = '2348145173339';
  const KUFRE_WA = '2348051426659';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }

    const contact = {
      id: generateId(),
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    saveContact(contact);

    const waMsg = `NEW REPORT from ${name}%0aEmail: ${email}%0aMessage: ${message}`;

    window.open(`https://wa.me/${NENGI_WA}?text=${waMsg}`, '_blank');
    window.open(`https://wa.me/${KUFRE_WA}?text=${waMsg}`, '_blank');

    form.reset();
    success.classList.add('show');
  });
});
