let currentCourseId = null;
let enrollments = []; // Initialize empty enrollments array

// Function to load student enrollments
async function loadStudentEnrollments(studentId) {
  try {
    console.log('Loading enrollments for student ID:', studentId);

    // If studentData is available, we can use completedCourses as enrollments
    if (studentData && studentData.completedCourses) {
      enrollments = courseData.filter((course) =>
        studentData.completedCourses.includes(course.name)
      );
      console.log('Loaded enrollments from student data:', enrollments);
      return enrollments;
    }

    return [];
  } catch (error) {
    console.error('Error loading student enrollments:', error);
    return [];
  }
}

// Update the viewCourseDetails function
function viewCourseDetails(courseId) {
  currentCourseId = courseId;
  const course = courseData.find((c) => c._id === courseId);

  if (!course) {
    console.error('Course not found:', courseId);
    return;
  }

  const courseDetailsContainer = document.getElementById('course-details');
  if (!courseDetailsContainer) {
    console.error('Course details container not found');
    return;
  }

  // Format schedule
  let scheduleHtml = '';
  if (course.schedule && course.schedule.length > 0) {
    scheduleHtml =
      '<div class="mt-3"><h6>Schedule:</h6><ul class="schedule-list">';
    course.schedule.forEach((slot) => {
      scheduleHtml += `<li><span class="day">${slot.day}:</span> ${slot.startTime} - ${slot.endTime}</li>`;
    });
    scheduleHtml += '</ul></div>';
  }

  // Format prerequisites
  let prerequisitesHtml = '';
  if (course.prerequisites && course.prerequisites.length > 0) {
    prerequisitesHtml =
      '<div class="mt-3"><h6>Prerequisites:</h6><ul class="prerequisites-list">';
    course.prerequisites.forEach((prereq) => {
      prerequisitesHtml += `<li>${prereq}</li>`;
    });
    prerequisitesHtml += '</ul></div>';
  } else {
    prerequisitesHtml =
      '<div class="mt-3"><p><em>No prerequisites required</em></p></div>';
  }

  courseDetailsContainer.innerHTML = `
    <h4 class="course-title">${course.name} <span class="course-code">(${
    course.courseCode
  })</span></h4>
    <div class="course-meta">
      <span class="badge badge-primary">${course.department}</span>
      <span class="badge badge-info">${course.semester}</span>
      <span class="badge ${
        course.seats > 5 ? 'badge-success' : 'badge-warning'
      }">${course.seats} Seats Available</span>
    </div>
    <p class="course-description">${course.description}</p>
    <div class="course-details">
      <div class="detail-row">
        <div class="detail-item">
          <strong>Credit Hours:</strong> ${course.creditHours}
        </div>
        <div class="detail-item">
          <strong>Department:</strong> ${course.department}
        </div>
      </div>
      <div class="detail-row">
        <div class="detail-item">
          <strong>Semester:</strong> ${course.semester}
        </div>
      </div>
    </div>
    ${prerequisitesHtml}
    ${scheduleHtml}
  `;

  // Update enroll button status
  const enrollBtn = document.getElementById('enroll-btn');
  if (!enrollBtn) {
    console.error('Enroll button not found');
    return;
  }

  // Check if already enrolled
  const isEnrolled =
    studentData &&
    studentData.completedCourses &&
    studentData.completedCourses.includes(course.name);

  if (isEnrolled) {
    enrollBtn.textContent = 'Already Enrolled';
    enrollBtn.disabled = true;
    enrollBtn.classList.add('secondary');
    enrollBtn.classList.remove('primary');
  } else if (course.seats <= 0) {
    enrollBtn.textContent = 'No Seats Available';
    enrollBtn.disabled = true;
    enrollBtn.classList.add('danger');
    enrollBtn.classList.remove('primary');
  } else {
    enrollBtn.textContent = 'Enroll in Course';
    enrollBtn.disabled = false;
    enrollBtn.classList.add('primary');
    enrollBtn.classList.remove('secondary');
    enrollBtn.classList.remove('danger');
  }

  // Show the modal
  const modal = document.getElementById('enrollModal');
  if (modal) {
    modal.classList.add('show');
  }
}

// Update the enrollInCourse function
async function enrollInCourse() {
  if (!currentCourseId || !studentData) {
    console.error('Missing course ID or student data');
    return;
  }

  const course = courseData.find((c) => c._id === currentCourseId);
  if (!course) {
    console.error('Course not found:', currentCourseId);
    return;
  }

  // Show loading state
  const enrollBtn = document.getElementById('enroll-btn');
  const originalBtnText = enrollBtn.textContent;
  enrollBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enrolling...';
  enrollBtn.disabled = true;

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('You must be logged in to enroll');
    }

    console.log('Enrolling in course:', currentCourseId);
    console.log('Student ID:', studentData._id);

    // Prepare the request payload according to your backend API requirements
    const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        student: studentData._id,
        course: currentCourseId,
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid server response');
    }

    if (!response.ok) {
      if (data && data.message) {
        throw new Error(data.message);
      } else {
        throw new Error('Failed to enroll in the course');
      }
    }

    console.log('Enrollment successful:', data);

    // Show success message
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert success';
    alertContainer.innerHTML = `
      <i class="fas fa-check-circle"></i>
      Successfully enrolled in ${course.name}!
    `;
    document.querySelector('.main-content').prepend(alertContainer);

    // Auto-remove the alert after 5 seconds
    setTimeout(() => {
      alertContainer.remove();
    }, 5000);

    // Close modal
    const modal = document.getElementById('enrollModal');
    if (modal) {
      modal.classList.remove('show');
    }

    // Reload data to refresh the UI
    await loadCoursesData();
    await loadStudentData();
  } catch (error) {
    console.error('Error enrolling:', error);

    // Show error message
    const alertContainer = document.createElement('div');
    alertContainer.className = 'alert danger';
    alertContainer.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      ${error.message || 'Failed to enroll. Please try again.'}
    `;
    document.querySelector('.main-content').prepend(alertContainer);

    // Auto-remove the alert after 5 seconds
    setTimeout(() => {
      alertContainer.remove();
    }, 5000);
  } finally {
    // Restore button state
    enrollBtn.innerHTML = originalBtnText;
    enrollBtn.disabled = false;
  }
}
