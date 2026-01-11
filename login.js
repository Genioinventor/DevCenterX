// Login system for DevCenter
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const demoBtn = document.getElementById('demoBtn');
  const themeToggle = document.getElementById('themeToggle');
  
  // Handle login form
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      
      if (username && password) {
        // Save user session
        localStorage.setItem('devcenter_user', username);
        localStorage.setItem('devcenter_login_time', new Date().toISOString());
        
        // Redirect to main page
        window.location.href = '/';
        return false;
      }
    });
  }

  // Demo access
  if (demoBtn) {
    demoBtn.addEventListener('click', () => {
      localStorage.setItem('devcenter_user', 'Demo User');
      localStorage.setItem('devcenter_demo_mode', 'true');
      window.location.href = '/';
    });
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = localStorage.getItem('theme') || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      
      if (newTheme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
    });
  }

  // Initialize theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (savedTheme === 'light') {
    document.documentElement.classList.add('theme-light');
  }
});

// Logout handler
function handleLogout() {
  localStorage.removeItem('devcenter_user');
  localStorage.removeItem('devcenter_demo_mode');
  localStorage.removeItem('devcenter_login_time');
  window.location.href = '/index.html';
}
