let courseData = [];

async function loadCoursesData() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      window.location.href = 'login.html';
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw course data received:', data);

    // Store the course data globally
    courseData = Array.isArray(data) ? data : data.data || [];
    console.log('Processed course data:', courseData);

    // Populate course lists
    populateAvailableCourses();
    populateEnrolledCourses();

    return courseData;
  } catch (error) {
    console.error('Error loading courses:', error);
    const coursesContainer = document.getElementById('available-courses');
    if (coursesContainer) {
      coursesContainer.innerHTML = `
        <div class="alert danger">
          <i class="fas fa-exclamation-circle"></i>
          Failed to load courses: ${error.message}
        </div>
      `;
    }
    return [];
  }
}

// Function to render enrolled courses
function renderEnrolledCourse(course) {
  return `
    <div class="course-card">
      <div class="course-header">
        <h3>${course.name}</h3>
        <div class="course-code">${course.courseCode}</div>
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span class="course-badge badge-credit">${
            course.creditHours
          } Credits</span>
          <span class="course-badge badge-department">${
            course.department
          }</span>
        </div>
        <p class="course-description">${
          course.description
            ? course.description.substring(0, 120) + '...'
            : 'No description available'
        }</p>
      </div>
      <div class="course-footer">
        <span class="course-status status-enrolled">
          <i class="fas fa-check-circle"></i> Enrolled
        </span>
        <div class="course-actions">
          <button class="btn small primary" onclick="viewCourseDetails('${
            course._id
          }')">
            <i class="fas fa-info-circle"></i> Details
          </button>
        </div>
      </div>
    </div>
  `;
}

// Function to render available courses
function renderAvailableCourse(course) {
  return `
    <div class="course-card">
      <div class="course-header">
        <h3>${course.name}</h3>
        <div class="course-code">${course.courseCode}</div>
      </div>
      <div class="course-body">
        <div class="course-meta">
          <span class="course-badge badge-credit">${
            course.creditHours
          } Credits</span>
          <span class="course-badge badge-department">${
            course.department
          }</span>
          <span class="course-badge badge-seats">${course.seats} Seats</span>
        </div>
        <p class="course-description">${
          course.description
            ? course.description.substring(0, 120) + '...'
            : 'No description available'
        }</p>
      </div>
      <div class="course-footer">
        <span class="course-status status-available">
          <i class="fas fa-clock"></i> Available
        </span>
        <div class="course-actions">
          <button class="btn small primary" onclick="viewCourseDetails('${
            course._id
          }')">
            <i class="fas fa-info-circle"></i> Details
          </button>
        </div>
      </div>
    </div>
  `;
}

function populateEnrolledCourses() {
  const enrolledCoursesContainer = document.getElementById('enrolled-courses');
  if (!enrolledCoursesContainer) {
    console.error('Enrolled courses container not found');
    return;
  }

  console.log('Student data for enrolled courses:', studentData);

  // Check if we have the student's completed courses
  const completedCourses = studentData?.completedCourses || [];

  if (completedCourses.length === 0) {
    enrolledCoursesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book-open"></i>
        <p>You have not enrolled in any courses yet.</p>
      </div>
    `;
    return;
  }

  // Find courses that match the completed course names
  const enrolledCoursesList = courseData.filter((course) =>
    completedCourses.includes(course.name)
  );

  console.log('Enrolled courses list:', enrolledCoursesList);

  if (enrolledCoursesList.length === 0) {
    enrolledCoursesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>Could not find details for your enrolled courses.</p>
      </div>
    `;
    return;
  }

  const html = enrolledCoursesList
    .map((course) => renderEnrolledCourse(course))
    .join('');
  enrolledCoursesContainer.innerHTML = html;

  // Update dashboard stats
  const enrolledCountElement = document.getElementById('enrolled-count');
  if (enrolledCountElement) {
    enrolledCountElement.textContent = enrolledCoursesList.length;
  }

  // Update credit hours if applicable
  const creditHoursElement = document.getElementById('credit-hours');
  if (creditHoursElement) {
    const totalCreditHours = enrolledCoursesList.reduce(
      (total, course) => total + Number(course.creditHours),
      0
    );
    creditHoursElement.textContent = totalCreditHours;
  }
}

// Function to populate available courses
function populateAvailableCourses() {
  const availableCoursesContainer =
    document.getElementById('available-courses');
  if (!availableCoursesContainer) {
    console.error('Available courses container not found');
    return;
  }

  if (!courseData || courseData.length === 0) {
    availableCoursesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <p>No courses available at this time.</p>
      </div>
    `;
    return;
  }

  // Get the list of enrolled course names
  const enrolledCourseNames = studentData?.completedCourses || [];
  console.log('Enrolled course names:', enrolledCourseNames);

  // Filter out courses that the student is already enrolled in
  const availableCourses = courseData.filter(
    (course) => !enrolledCourseNames.includes(course.name)
  );

  console.log('Available courses to display:', availableCourses);

  if (availableCourses.length === 0) {
    availableCoursesContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-check-circle"></i>
        <p>You're enrolled in all available courses!</p>
      </div>
    `;
    return;
  }

  const html = availableCourses
    .map((course) => renderAvailableCourse(course))
    .join('');
  availableCoursesContainer.innerHTML = html;
}

// Function to render course details in modal
function renderCourseDetails(course) {
  const modalContent = document.querySelector('.course-details');
  if (!modalContent) return;

  // Update header
  modalContent.querySelector('.course-details-title').textContent = course.name;
  modalContent.querySelector('.course-details-code').textContent =
    course.courseCode;

  // Update details
  modalContent.querySelector('.credit-hours').textContent = course.creditHours;
  modalContent.querySelector('.department').textContent = course.department;
  modalContent.querySelector('.semester').textContent = course.semester;
  modalContent.querySelector('.seats').textContent = course.seats;

  // Update schedule
  const scheduleList = modalContent.querySelector('.schedule-list');
  if (scheduleList && course.schedule) {
    scheduleList.innerHTML = course.schedule
      .map(
        (schedule) => `
        <li class="schedule-item">
          <span class="schedule-day">${schedule.day}</span>
          <span class="schedule-time">${schedule.time}</span>
        </li>
      `
      )
      .join('');
  }

  // Update prerequisites
  const prerequisitesInfo = modalContent.querySelector('.prerequisites-info');
  if (prerequisitesInfo) {
    if (course.prerequisites && course.prerequisites.length > 0) {
      prerequisitesInfo.innerHTML = `
        <ul class="prerequisites-list">
          ${course.prerequisites
            .map(
              (prereq) => `
              <li class="prerequisite-item">
                <i class="fas fa-check-circle"></i> ${prereq}
              </li>
            `
            )
            .join('')}
        </ul>
      `;
    } else {
      prerequisitesInfo.innerHTML = '<p>No prerequisites required</p>';
    }
  }
}

// Function to filter available courses
function filterAvailableCourses() {
  const searchTerm = document
    .getElementById('available-course-search')
    .value.toLowerCase();
  const department = document.getElementById('department-filter').value;

  const courseItems = document.querySelectorAll('.course-item');

  courseItems.forEach((item) => {
    const courseName = item
      .querySelector('.card-title')
      .textContent.toLowerCase();
    const courseDescription = item
      .querySelector('.card-text')
      .textContent.toLowerCase();
    const courseDepartment = item.dataset.department;

    const matchesSearch =
      courseName.includes(searchTerm) || courseDescription.includes(searchTerm);
    const matchesDepartment =
      department === 'all' || courseDepartment === department;

    if (matchesSearch && matchesDepartment) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Initialize course functionality
document.addEventListener('DOMContentLoaded', function () {
  // Populate courses
  populateEnrolledCourses();
  populateAvailableCourses();

  // Setup search functionality
  const courseSearch = document.getElementById('course-search');
  if (courseSearch) {
    courseSearch.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const courseCards = document.querySelectorAll(
        '#enrolled-courses .course-card'
      );

      courseCards.forEach((card) => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const code = card
          .querySelector('.course-code')
          .textContent.toLowerCase();
        const matches = title.includes(searchTerm) || code.includes(searchTerm);
        card.style.display = matches ? 'flex' : 'none';
      });
    });
  }

  // Setup available courses search
  const availableCourseSearch = document.getElementById(
    'available-course-search'
  );
  if (availableCourseSearch) {
    availableCourseSearch.addEventListener('input', function () {
      const searchTerm = this.value.toLowerCase();
      const courseCards = document.querySelectorAll(
        '#available-courses .course-card'
      );

      courseCards.forEach((card) => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const code = card
          .querySelector('.course-code')
          .textContent.toLowerCase();
        const matches = title.includes(searchTerm) || code.includes(searchTerm);
        card.style.display = matches ? 'flex' : 'none';
      });
    });
  }
});
