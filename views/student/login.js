document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginButton = document.getElementById('loginButton');
  const errorMessage = document.getElementById('errorMessage');
  const rollNumberInput = document.getElementById('rollNumber');

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 3000);
  }

  function setLoading(isLoading) {
    loginButton.disabled = isLoading;
    loginButton.textContent = isLoading ? 'Logging in...' : 'Login';
    if (isLoading) {
      loginButton.classList.add('loading');
    } else {
      loginButton.classList.remove('loading');
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const rollNumber = rollNumberInput.value.trim();

    if (!rollNumber) {
      showError('Please enter your roll number');
      return;
    }

    setLoading(true);
    errorMessage.style.display = 'none';

    try {
      console.log('Attempting login with roll number:', rollNumber);

      const response = await fetch(`${API_BASE_URL}/api/students/signIn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ rollNo: rollNumber }),
        mode: 'cors',
      });

      const data = await response.json();
      console.log('Login response:', data);

      // Check for error based on API's actual response structure
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // The controller is returning a response with { status, data, token } structure
      if (data.token) {
        localStorage.setItem('token', data.token);

        // Check if student data is in the expected location based on controller
        if (data.data) {
          localStorage.setItem('studentData', JSON.stringify(data.data));
        } else if (data.student) {
          localStorage.setItem('studentData', JSON.stringify(data.student));
        }

        console.log('Login successful, redirecting to dashboard');
        window.location.href = 'dashboard.html';
      } else {
        console.error('No token received in response');
        showError('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // Clear error message when user starts typing
  rollNumberInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
  });
});
