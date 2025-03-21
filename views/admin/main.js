document.addEventListener('DOMContentLoaded', function () {
  console.log('Initializing admin dashboard main script');

  // Check if token exists and redirect to login if not
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // Handle navigation/tab switching
  const navLinks = document.querySelectorAll('.nav-link');
  const tabPanels = document.querySelectorAll('.tab-panel');

  navLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();

      const targetTab = this.getAttribute('data-tab');
      if (!targetTab) return;

      // Remove active class from all links and panels
      navLinks.forEach((link) => link.classList.remove('active'));
      tabPanels.forEach((panel) => panel.classList.remove('active'));

      // Add active class to clicked link and its corresponding panel
      this.classList.add('active');
      document.getElementById(`${targetTab}-panel`).classList.add('active');
    });
  });

  // Handle logout
  document.getElementById('logout-btn').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('adminData');
    window.location.href = 'login.html';
  });

  // Setup modal close buttons
  document
    .querySelectorAll('.close-btn, [data-dismiss="modal"]')
    .forEach((btn) => {
      btn.addEventListener('click', function () {
        const modalId = this.closest('.modal').id;
        document.getElementById(modalId).classList.remove('show');
        document.getElementById(modalId).style.display = 'none';

        // Remove modal backdrop if exists
        const modalBackdrops =
          document.getElementsByClassName('modal-backdrop');
        while (modalBackdrops.length > 0) {
          modalBackdrops[0].parentNode.removeChild(modalBackdrops[0]);
        }

        // Remove body classes
        document.body.classList.remove('modal-open');
      });
    });

  // Initialize course functionality
  initializeCourseManagement();

  // Initialize student functionality
  initializeStudentManagement();

  // Initialize dashboard stats
  updateDashboardStats();
});

// Function to initialize course management
function initializeCourseManagement() {
  // Load courses
  loadCourses();

  // Setup course filter event listeners
  const courseSearchInput = document.getElementById('course-search');
  if (courseSearchInput) {
    courseSearchInput.addEventListener('input', updateCoursesTable);
  }

  const departmentFilter = document.getElementById('department-filter');
  if (departmentFilter) {
    departmentFilter.addEventListener('change', updateCoursesTable);
  }

  const semesterFilter = document.getElementById('semester-filter');
  if (semesterFilter) {
    semesterFilter.addEventListener('change', updateCoursesTable);
  }

  // Setup add course button
  const addCourseBtn = document.getElementById('add-course-btn');
  if (addCourseBtn) {
    addCourseBtn.addEventListener('click', function () {
      // Reset form and show modal
      resetCourseForm();
      showModal('course-modal');
    });
  }

  // Setup save course button
  const saveCourseBtn = document.getElementById('save-course-btn');
  if (saveCourseBtn) {
    saveCourseBtn.addEventListener('click', saveCourse);
  }

  // Setup add schedule button
  const addScheduleBtn = document.getElementById('add-schedule-btn');
  if (addScheduleBtn) {
    addScheduleBtn.addEventListener('click', addScheduleItem);
  }

  // Setup delete confirmation button
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', deleteCourse);
  }
}

// Function to initialize student management
function initializeStudentManagement() {
  loadStudents();
}

// Function to show modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
  }
}

// Function to hide modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');

    // Remove modal backdrop if exists
    const modalBackdrops = document.getElementsByClassName('modal-backdrop');
    while (modalBackdrops.length > 0) {
      modalBackdrops[0].parentNode.removeChild(modalBackdrops[0]);
    }
  }
}

// Function to reset course form
function resetCourseForm() {
  const form = document.getElementById('course-form');
  if (form) {
    form.reset();
    document.getElementById('course-id').value = '';
    document.getElementById('course-modal-title').textContent =
      'Add New Course';

    // Reset schedule container to have just one item
    const scheduleContainer = document.getElementById('schedule-container');
    if (scheduleContainer) {
      scheduleContainer.innerHTML = `
        <div class="schedule-item">
          <select class="day-select">
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
          </select>
          <input type="time" class="start-time" required />
          <input type="time" class="end-time" required />
          <button type="button" class="btn danger remove-schedule">
            Remove
          </button>
        </div>
      `;

      // Add event listener to the remove button
      const removeBtn = scheduleContainer.querySelector('.remove-schedule');
      if (removeBtn) {
        removeBtn.addEventListener('click', function () {
          if (scheduleContainer.children.length > 1) {
            this.closest('.schedule-item').remove();
          } else {
            alert('At least one schedule item is required');
          }
        });
      }
    }
  }
}

// Function to update dashboard stats
function updateDashboardStats() {
  // Update course count
  const totalCoursesElement = document.getElementById('total-courses');
  if (totalCoursesElement && window.courses) {
    totalCoursesElement.textContent = window.courses.length;
  }

  // Load low seat courses for dashboard
  updateLowSeatCourses();
}

// Function to update low seat courses in dashboard
function updateLowSeatCourses() {
  const lowSeatCoursesElement = document.getElementById('low-seat-courses');
  if (lowSeatCoursesElement && window.courses) {
    const lowSeatCourses = window.courses.filter((course) => course.seats <= 5);

    if (lowSeatCourses.length === 0) {
      lowSeatCoursesElement.innerHTML =
        '<p>No courses with low seat availability</p>';
      return;
    }

    let html = '';
    lowSeatCourses.forEach((course) => {
      html += `
        <div class="alert ${
          course.seats <= 2 ? 'alert danger' : 'alert warning'
        }">
          <strong>${course.name}</strong> (${course.courseCode}) - 
          <span class="badge ${
            course.seats <= 2 ? 'bg-danger' : 'bg-warning'
          }">${course.seats} seats</span>
        </div>
      `;
    });

    lowSeatCoursesElement.innerHTML = html;
  }
}
