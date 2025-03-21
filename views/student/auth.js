// Check if the user is logged in
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', function () {
  localStorage.removeItem('token');
  window.location.href = '/login';
});

// Set up axios defaults with auth token
function setupAxios() {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
}
