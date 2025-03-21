// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing student dashboard...');

  // Check authentication
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
    window.location.href = 'login.html';
    return;
  }

  try {
    // Parse token to get student ID
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    const studentId = tokenPayload.id;
    console.log('Student ID from token:', studentId);

    if (!studentId) {
      throw new Error('Invalid token: No student ID found');
    }

    // Initialize all data loading
    await Promise.all([
      loadStudentData(),
      loadCoursesData(),
      loadStudentSchedule(studentId),
    ]);

    // Re-populate the courses after data is loaded
    populateEnrolledCourses();
    populateAvailableCourses();

    // Setup UI components after data is loaded
    setupUIComponents();

    // Setup event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
});

// Function to setup UI components
function setupUIComponents() {
  // Setup enrollment button
  const enrollBtn = document.getElementById('enroll-btn');
  if (enrollBtn) {
    enrollBtn.addEventListener('click', enrollInCourse);
  }

  // Setup filter for available courses
  const departmentFilter = document.getElementById('department-filter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', filterAvailableCourses);
  }

  const courseSearch = document.getElementById('available-course-search');
  if (courseSearch) {
    courseSearch.addEventListener('input', filterAvailableCourses);
  }
}

// Function to setup event listeners
function setupEventListeners() {
  // Handle tab switching to refresh data
  const navLinks = document.querySelectorAll('.nav-link');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      if (this.id === 'logout-btn') return;
      e.preventDefault();

      // Get tab ID from data attribute
      const tabId = this.getAttribute('data-tab');

      // Remove active class from all links and tab panes
      navLinks.forEach((l) => l.classList.remove('active'));
      tabPanes.forEach((p) => p.classList.remove('active'));

      // Add active class to current link and tab pane
      this.classList.add('active');
      const currentPane = document.getElementById(tabId);
      if (currentPane) {
        currentPane.classList.add('active');
      }

      // Refresh data based on tab
      if (tabId === 'courses') {
        populateEnrolledCourses();
      } else if (tabId === 'enrollment') {
        populateAvailableCourses();
      } else if (tabId === 'schedule') {
        const token = localStorage.getItem('token');
        const studentId = token
          ? JSON.parse(atob(token.split('.')[1])).id
          : null;
        if (studentId) {
          loadStudentSchedule(studentId);
        }
      }
    });
  });
}

// Modal close functionality
const closeButtons = document.querySelectorAll('[data-dismiss="modal"]');
closeButtons.forEach((button) => {
  button.addEventListener('click', function () {
    const modal = this.closest('.modal');
    if (modal) {
      modal.classList.remove('show');
    }
  });
});

// Close modal when clicking outside content
const modals = document.querySelectorAll('.modal');
modals.forEach((modal) => {
  modal.addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.remove('show');
    }
  });
});

// Helper function to show notification
function showNotification(message, type = 'info') {
  const notificationContainer = document.createElement('div');
  notificationContainer.className = `alert ${type}`;
  notificationContainer.innerHTML = `
    ${message}
    <button type="button" class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(notificationContainer);
  notificationContainer.style.position = 'fixed';
  notificationContainer.style.bottom = '20px';
  notificationContainer.style.right = '20px';
  notificationContainer.style.zIndex = '1000';
  notificationContainer.style.width = '300px';
  notificationContainer.style.maxWidth = '90%';
  notificationContainer.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  notificationContainer.style.display = 'flex';
  notificationContainer.style.justifyContent = 'space-between';
  notificationContainer.style.alignItems = 'center';

  setTimeout(() => {
    notificationContainer.remove();
  }, 5000);
}
