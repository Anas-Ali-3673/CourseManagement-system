const API_BASE_URL = 'http://localhost:5000';

document
  .getElementById('loginForm')
  .addEventListener('submit', async function (event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Disable the submit button during login attempt
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();
      console.log('data', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.status === 'success' && data.token) {
        // Store both token and admin data
        localStorage.setItem('token', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.data.admin));
        window.location.href = 'dashboard.html';
      } else {
        showError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Login failed. Please try again.');
    } finally {
      // Re-enable the submit button
      submitButton.disabled = false;
      submitButton.textContent = 'Sign In';
    }
  });

function showError(message) {
  // Create error element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.color = '#ff3860';
  errorDiv.style.marginTop = '10px';
  errorDiv.style.fontSize = '14px';
  errorDiv.textContent = message;

  // Remove any existing error messages
  const existingError = document.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }

  // Add the new error message
  const form = document.getElementById('loginForm');
  form.appendChild(errorDiv);

  // Remove the error message after 3 seconds
  setTimeout(() => {
    errorDiv.remove();
  }, 3000);
}
