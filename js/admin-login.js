document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('adminLoginForm');
  var loginInput = document.getElementById('loginEmail');
  var passInput = document.getElementById('loginPass');
  var errorEl = document.getElementById('loginError');
  var loginBtn = document.getElementById('loginBtn');
  var emoji = document.getElementById('loginEmoji');

  if (sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin.html';
    return;
  }

  function clearEmoji() { emoji.textContent = ''; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearEmoji();

    var val = loginInput.value.trim();
    var password = passInput.value.trim();

    if (!val || !password) {
      errorEl.textContent = 'Please enter username/email and password.';
      errorEl.style.display = 'block';
      return;
    }

    var email = val;
    if (val.indexOf('@') === -1) {
      var admins = getAdmins();
      var match = null;
      for (var i = 0; i < admins.length; i++) {
        if (admins[i].displayName === val) { match = admins[i]; break; }
      }
      if (!match) {
        errorEl.textContent = 'Admin username not found.';
        errorEl.style.display = 'block';
        return;
      }
      email = match.email;
    }

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    authenticateAdmin(email, password).then(function (admin) {
      if (admin) {
        emoji.textContent = '😊';
        updateAdminLastSeen(email);
        sessionStorage.setItem('adminLoggedIn', admin.displayName);
        sessionStorage.setItem('adminEmail', email);
        setTimeout(function () { window.location.href = 'admin.html'; }, 800);
      } else {
        emoji.textContent = '😢';
        errorEl.textContent = 'Invalid email or password.';
        errorEl.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        setTimeout(clearEmoji, 3000);
      }
    });
  });
});
