document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('adminLoginForm');
  var emailInput = document.getElementById('loginEmail');
  var passInput = document.getElementById('loginPass');
  var errorEl = document.getElementById('loginError');

  if (sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin.html';
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var email = emailInput.value.trim();
    var password = passInput.value.trim();

    if (!email || !password) {
      errorEl.textContent = 'Please enter email and password.';
      errorEl.style.display = 'block';
      return;
    }

    authenticateAdmin(email, password).then(function (admin) {
      if (admin) {
        updateAdminLastSeen(email);
        sessionStorage.setItem('adminLoggedIn', admin.displayName);
        sessionStorage.setItem('adminEmail', email);
        window.location.href = 'admin.html';
      } else {
        errorEl.textContent = 'Invalid email or password.';
        errorEl.style.display = 'block';
      }
    });
  });
});
