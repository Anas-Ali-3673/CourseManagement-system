let courses = [];
let currentCourseId = null;

// Function to check if admin is authenticated
function checkAdminAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('No authentication token found');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Function to load all courses
async function loadCourses() {
  try {
    if (!checkAdminAuth()) return [];

    const token = localStorage.getItem('token');
    console.log('Fetching courses with token:', token.substring(0, 20) + '...');

    const response = await fetch(`${API_BASE_URL}/api/courses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('Course API response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to load courses: ${response.status}`);
    }

    const data = await response.json();
    console.log('Courses data received:', data);

    // Store courses globally
    window.courses = Array.isArray(data) ? data : [];
    courses = window.courses;

    console.log(`Loaded ${courses.length} courses`);

    // Update UI
    updateCoursesTable();
    populateFilters();
    updateDashboardStats();

    return courses;
  } catch (error) {
    console.error('Error loading courses:', error);
    showErrorMessage(`Failed to load courses: ${error.message}`);
    return [];
  }
}

// Function to update the courses table
function updateCoursesTable() {
  const tableBody = document
    .getElementById('courses-table')
    .querySelector('tbody');
  if (!tableBody) {
    console.error('Course table body not found in DOM');
    return;
  }

  // Get filter values
  const searchTerm =
    document.getElementById('course-search')?.value?.toLowerCase() || '';
  const departmentFilter =
    document.getElementById('department-filter')?.value || 'all';
  const semesterFilter =
    document.getElementById('semester-filter')?.value || 'all';

  console.log('Filtering courses with:', {
    searchTerm,
    departmentFilter,
    semesterFilter,
  });

  // Filter courses
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchTerm) ||
      course.courseCode.toLowerCase().includes(searchTerm);

    const matchesDepartment =
      departmentFilter === 'all' || course.department === departmentFilter;
    const matchesSemester =
      semesterFilter === 'all' || course.semester === semesterFilter;

    return matchesSearch && matchesDepartment && matchesSemester;
  });

  console.log(`Filtered to ${filteredCourses.length} courses`);

  if (filteredCourses.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center">No courses found</td></tr>';
    return;
  }

  let html = '';
  filteredCourses.forEach((course) => {
    html += `
      <tr>
        <td>${course.name}</td>
        <td>${course.courseCode}</td>
        <td>${course.creditHours}</td>
        <td>${course.department}</td>
        <td>${course.semester}</td>
        <td><span class="badge ${
          course.seats > 5 ? 'bg-success' : 'bg-warning'
        }">${course.seats}</span></td>
        <td>
          <button class="btn primary" onclick="editCourse('${
            course._id
          }')">Edit</button>
          <button class="btn danger" onclick="confirmDeleteCourse('${
            course._id
          }')">Delete</button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// Function to populate filter dropdowns
function populateFilters() {
  // Populate department filter
  const departments = [...new Set(courses.map((course) => course.department))];
  const departmentSelect = document.getElementById('department-filter');

  if (departmentSelect) {
    // Clear existing options except the first one
    while (departmentSelect.options.length > 1) {
      departmentSelect.remove(1);
    }

    // Add department options
    departments.forEach((dept) => {
      const option = document.createElement('option');
      option.value = dept;
      option.textContent = dept;
      departmentSelect.appendChild(option);
    });
  }

  // Populate semester filter
  const semesters = [...new Set(courses.map((course) => course.semester))];
  const semesterSelect = document.getElementById('semester-filter');

  if (semesterSelect) {
    // Clear existing options except the first one
    while (semesterSelect.options.length > 1) {
      semesterSelect.remove(1);
    }

    // Add semester options
    semesters.forEach((semester) => {
      const option = document.createElement('option');
      option.value = semester;
      option.textContent = semester;
      semesterSelect.appendChild(option);
    });
  }
}

// Function to add schedule item to the form
function addScheduleItem() {
  const scheduleContainer = document.getElementById('schedule-container');
  if (!scheduleContainer) return;

  const newItem = document.createElement('div');
  newItem.className = 'schedule-item';
  newItem.innerHTML = `
    <select class="day-select">
      <option value="Monday">Monday</option>
      <option value="Tuesday">Tuesday</option>
      <option value="Wednesday">Wednesday</option>
      <option value="Thursday">Thursday</option>
      <option value="Friday">Friday</option>
    </select>
    <input type="time" class="start-time" required />
    <input type="time" class="end-time" required />
    <button type="button" class="btn danger remove-schedule">Remove</button>
  `;

  scheduleContainer.appendChild(newItem);

  // Add event listener to the remove button
  newItem
    .querySelector('.remove-schedule')
    .addEventListener('click', function () {
      if (scheduleContainer.children.length > 1) {
        this.closest('.schedule-item').remove();
      } else {
        alert('At least one schedule item is required');
      }
    });
}

// Function to edit course
function editCourse(courseId) {
  const course = courses.find((c) => c._id === courseId);
  if (!course) {
    console.error('Course not found:', courseId);
    return;
  }

  currentCourseId = courseId;

  // Set modal title
  document.getElementById('course-modal-title').textContent = 'Edit Course';

  // Populate form fields
  document.getElementById('course-id').value = course._id;
  document.getElementById('course-name').value = course.name;
  document.getElementById('course-code').value = course.courseCode;
  document.getElementById('course-description').value = course.description;
  document.getElementById('credit-hours').value = course.creditHours;
  document.getElementById('department').value = course.department;
  document.getElementById('semester').value = course.semester;
  document.getElementById('seats').value = course.seats;
  document.getElementById('prerequisites').value =
    course.prerequisites.join(', ');

  // Clear existing schedule items
  const scheduleContainer = document.getElementById('schedule-container');
  scheduleContainer.innerHTML = '';

  // Add schedule items
  if (course.schedule && course.schedule.length > 0) {
    course.schedule.forEach((slot) => {
      const scheduleItem = document.createElement('div');
      scheduleItem.className = 'schedule-item';
      scheduleItem.innerHTML = `
        <select class="day-select">
          <option value="Monday" ${
            slot.day === 'Monday' ? 'selected' : ''
          }>Monday</option>
          <option value="Tuesday" ${
            slot.day === 'Tuesday' ? 'selected' : ''
          }>Tuesday</option>
          <option value="Wednesday" ${
            slot.day === 'Wednesday' ? 'selected' : ''
          }>Wednesday</option>
          <option value="Thursday" ${
            slot.day === 'Thursday' ? 'selected' : ''
          }>Thursday</option>
          <option value="Friday" ${
            slot.day === 'Friday' ? 'selected' : ''
          }>Friday</option>
        </select>
        <input type="time" class="start-time" value="${
          slot.startTime
        }" required />
        <input type="time" class="end-time" value="${slot.endTime}" required />
        <button type="button" class="btn danger remove-schedule">Remove</button>
      `;

      scheduleContainer.appendChild(scheduleItem);

      // Add event listener to the remove button
      scheduleItem
        .querySelector('.remove-schedule')
        .addEventListener('click', function () {
          if (scheduleContainer.children.length > 1) {
            this.closest('.schedule-item').remove();
          } else {
            alert('At least one schedule item is required');
          }
        });
    });
  } else {
    // Add at least one empty schedule item
    addScheduleItem();
  }

  // Show the modal
  showModal('course-modal');
}

// Function to confirm course deletion
function confirmDeleteCourse(courseId) {
  currentCourseId = courseId;

  const course = courses.find((c) => c._id === courseId);
  if (!course) {
    console.error('Course not found:', courseId);
    return;
  }

  // Update confirmation modal message
  const confirmationBody = document.querySelector(
    '#confirmation-modal .modal-body p'
  );
  if (confirmationBody) {
    confirmationBody.textContent = `Are you sure you want to delete the course "${course.name}" (${course.courseCode})? This action cannot be undone.`;
  }

  // Show confirmation modal
  showModal('confirmation-modal');
}

// Function to format time from input time element
function formatTime(timeValue) {
  if (!timeValue) return '';

  // If already in HH:MM format, return as is
  if (/^\d{2}:\d{2}$/.test(timeValue)) {
    return timeValue;
  }

  // Convert from input time format
  const [hours, minutes] = timeValue.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

// Function to save a course (create or update)
async function saveCourse() {
  try {
    if (!checkAdminAuth()) return;

    // Validate form
    const form = document.getElementById('course-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Get form values
    const courseId = document.getElementById('course-id').value;
    const name = document.getElementById('course-name').value;
    const courseCode = document.getElementById('course-code').value;
    const description = document.getElementById('course-description').value;
    const creditHours = parseInt(document.getElementById('credit-hours').value);
    const department = document.getElementById('department').value;
    const semester = document.getElementById('semester').value;
    const seats = parseInt(document.getElementById('seats').value);
    const prerequisites = document
      .getElementById('prerequisites')
      .value.split(',')
      .map((p) => p.trim())
      .filter((p) => p !== '');

    // Get schedule
    const scheduleItems = document.querySelectorAll('.schedule-item');
    const schedule = [];

    for (const item of scheduleItems) {
      const day = item.querySelector('.day-select').value;
      const startTime = item.querySelector('.start-time').value;
      const endTime = item.querySelector('.end-time').value;

      if (!day || !startTime || !endTime) {
        alert('Please fill in all schedule fields');
        return;
      }

      schedule.push({
        day,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      });
    }

    // Create course object
    const courseData = {
      name,
      courseCode,
      description,
      creditHours,
      department,
      semester,
      seats,
      prerequisites,
      schedule,
    };

    console.log('Saving course data:', courseData);

    // Disable save button
    const saveButton = document.getElementById('save-course-btn');
    saveButton.disabled = true;
    saveButton.textContent = courseId ? 'Updating...' : 'Creating...';

    const token = localStorage.getItem('token');
    let response;

    if (courseId) {
      // Update existing course
      response = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });
    } else {
      // Create new course
      response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseData),
      });
    }

    if (!response.ok) {
      throw new Error(`Failed to save course: ${response.status}`);
    }

    const savedCourse = await response.json();
    console.log(courseId ? 'Course updated:' : 'Course created:', savedCourse);

    // Close the modal
    hideModal('course-modal');

    // Show success message
    showSuccessMessage(
      courseId ? 'Course updated successfully!' : 'Course created successfully!'
    );

    // Reload courses
    await loadCourses();
  } catch (error) {
    console.error('Error saving course:', error);
    showErrorMessage(`Failed to save course: ${error.message}`);
  } finally {
    // Re-enable save button
    const saveButton = document.getElementById('save-course-btn');
    saveButton.disabled = false;
    saveButton.textContent = 'Save Course';
  }
}

// Function to delete a course
async function deleteCourse() {
  try {
    if (!checkAdminAuth() || !currentCourseId) return;

    // Disable delete button
    const deleteButton = document.getElementById('confirm-delete-btn');
    deleteButton.disabled = true;
    deleteButton.textContent = 'Deleting...';

    const token = localStorage.getItem('token');
    const response = await fetch(
      `${API_BASE_URL}/api/courses/${currentCourseId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete course: ${response.status}`);
    }

    // Close confirmation modal
    hideModal('confirmation-modal');

    // Show success message
    showSuccessMessage('Course deleted successfully!');

    // Reload courses
    await loadCourses();
  } catch (error) {
    console.error('Error deleting course:', error);
    showErrorMessage(`Failed to delete course: ${error.message}`);
  } finally {
    // Re-enable delete button
    const deleteButton = document.getElementById('confirm-delete-btn');
    deleteButton.disabled = false;
    deleteButton.textContent = 'Delete';
  }
}

// Function to show success message
function showSuccessMessage(message) {
  // Create a temporary div for the alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert success';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;

  // Add the alert to the document
  document.body.appendChild(alertDiv);

  // Position the alert at the top center
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translateX(-50%)';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';

  // Remove the alert after 3 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}

// Function to show error message
function showErrorMessage(message) {
  // Create a temporary div for the alert
  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert danger';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;

  // Add the alert to the document
  document.body.appendChild(alertDiv);

  // Position the alert at the top center
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.left = '50%';
  alertDiv.style.transform = 'translateX(-50%)';
  alertDiv.style.zIndex = '9999';
  alertDiv.style.minWidth = '300px';

  // Remove the alert after 5 seconds
  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}
