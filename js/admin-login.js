document.addEventListener('DOMContentLoaded', function () {

  const form = document.getElementById('adminLoginForm');
  const userInput = document.getElementById('loginUser');
  const passInput = document.getElementById('loginPass');
  const errorEl = document.getElementById('loginError');

  if (sessionStorage.getItem('adminLoggedIn')) {
    window.location.href = 'admin.html';
    return;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const username = userInput.value.trim();
    const password = passInput.value.trim();

    if (!username || !password) {
      errorEl.textContent = 'Please enter username and password.';
      errorEl.style.display = 'block';
      return;
    }

    const admin = authenticateAdmin(username, password);
    if (admin) {
      updateAdminLastSeen(username);
      sessionStorage.setItem('adminLoggedIn', username);
      window.location.href = 'admin.html';
    } else {
      errorEl.textContent = 'Invalid username or password.';
      errorEl.style.display = 'block';
    }
  });
});
