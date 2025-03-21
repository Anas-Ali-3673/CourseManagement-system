let enrollments = [];
let students = [];

// Function to load students data
async function loadStudents() {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load students: ${response.status}`);
    }

    const data = await response.json();
    console.log('enrollment.js: loadStudents -> data', data);
    students = Array.isArray(data) ? data : [];

    // Update student count in dashboard
    const totalStudentsElement = document.getElementById('total-students');
    if (totalStudentsElement) {
      totalStudentsElement.textContent = students.length;
    }

    return students;
  } catch (error) {
    console.error('Error loading students:', error);
    return [];
  }
}

// Function to load enrollments data
async function loadEnrollments() {
  try {
    const token = localStorage.getItem('token');

    // Load students first if not already loaded
    if (students.length === 0) {
      await loadStudents();
    }

    // Ensure courses are loaded
    if (!window.courses || window.courses.length === 0) {
      await loadCourses();
    }

    const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load enrollments: ${response.status}`);
    }

    const result = await response.json();
    console.log('Raw enrollment data:', result);

    // Handle different response formats (array vs object with data property)
    let enrollmentData;
    if (Array.isArray(result)) {
      enrollmentData = result;
    } else if (result.data && Array.isArray(result.data)) {
      enrollmentData = result.data;
    } else {
      enrollmentData = [];
    }

    // Map the enrollment data to match the expected structure
    enrollments = enrollmentData.map((enrollment) => {
      return {
        _id: enrollment._id,
        student: enrollment.student?._id || enrollment.student,
        course: enrollment.course?._id || enrollment.course,
        studentId: enrollment.student?._id || enrollment.student,
        courseId: enrollment.course?._id || enrollment.course,
        status: enrollment.status || 'pending',
        enrolledDate:
          enrollment.timestamp ||
          enrollment.enrolledDate ||
          new Date().toISOString(),
        grade: enrollment.grade || null,
        notes: enrollment.notes || null,
      };
    });

    console.log('Processed enrollments:', enrollments);

    // Update UI
    updateEnrollmentsTable();
    updateRecentEnrollments();

    // Update enrollment count in dashboard
    const totalEnrollmentsElement =
      document.getElementById('total-enrollments');
    if (totalEnrollmentsElement) {
      totalEnrollmentsElement.textContent = enrollments.length;
    }

    return enrollments;
  } catch (error) {
    console.error('Error loading enrollments:', error);
    showAlert('Failed to load enrollments. Please try again.', 'danger');
    return [];
  }
}

function updateEnrollmentsTable() {
  const tableBody = document.getElementById('enrollments-table-body');
  if (!tableBody) {
    console.warn('Enrollments table body not found in the DOM');
    return;
  }

  if (!enrollments || enrollments.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center">No enrollments found</td></tr>';
    return;
  }

  let html = '';
  enrollments.forEach((enrollment) => {
    // Find associated student
    const student = students.find((s) => s._id === enrollment.studentId);

    // Find associated course
    const course = window.courses?.find((c) => c._id === enrollment.courseId);

    if (!student || !course) {
      console.warn('Missing student or course for enrollment:', enrollment);
      console.log('Student found:', student);
      console.log('Course found:', course);
      return;
    }

    html += `
      <tr>
        <td>${student.name || 'Unknown'}</td>
        <td>${student.rollNo || 'N/A'}</td>
        <td>${course.name || 'Unknown'}</td>
        <td>${course.courseCode || 'N/A'}</td>
        <td>${new Date(enrollment.enrolledDate).toLocaleDateString()}</td>
        <td>
          <span class="badge ${getStatusBadgeClass(enrollment.status)}">
            ${enrollment.status || 'pending'}
          </span>
        </td>
        <td>
          <button class="btn primary small" onclick="viewEnrollmentDetails('${
            enrollment._id
          }')">
            View
          </button>
          <button class="btn danger small" onclick="confirmCancelEnrollment('${
            enrollment._id
          }')">
            Cancel
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

// Helper function to get badge class based on status
function getStatusBadgeClass(status) {
  switch (status) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
}

// Function to update recent enrollments section on dashboard
function updateRecentEnrollments() {
  const recentEnrollmentsElement =
    document.getElementById('recent-enrollments');
  if (!recentEnrollmentsElement) return;

  // Get the 5 most recent enrollments
  const recentEnrollments = [...enrollments]
    .sort((a, b) => new Date(b.enrolledDate) - new Date(a.enrolledDate))
    .slice(0, 5);

  if (recentEnrollments.length === 0) {
    recentEnrollmentsElement.innerHTML =
      '<p class="text-center">No recent enrollments</p>';
    return;
  }

  let html = '<div class="list-group">';
  recentEnrollments.forEach((enrollment) => {
    // Find associated student
    const student = students.find((s) => s._id === enrollment.studentId);

    // Find associated course
    const course = window.courses.find((c) => c._id === enrollment.courseId);

    if (!student || !course) return;

    const enrollmentDate = new Date(
      enrollment.enrolledDate
    ).toLocaleDateString();

    html += `
      <div class="list-group-item list-group-item-action">
        <div class="d-flex w-100 justify-content-between">
          <h5 class="mb-1">${student.name}</h5>
          <small>${enrollmentDate}</small>
        </div>
        <p class="mb-1">Enrolled in ${course.name} (${course.courseCode})</p>
        <small class="d-flex justify-content-between">
          <span>Student ID: ${student.studentId}</span>
          <span class="badge bg-${
            enrollment.status === 'active'
              ? 'success'
              : enrollment.status === 'pending'
              ? 'warning'
              : 'secondary'
          }">
            ${enrollment.status}
          </span>
        </small>
      </div>
    `;
  });
  html += '</div>';

  recentEnrollmentsElement.innerHTML = html;
}

// Function to view enrollment details
function viewEnrollmentDetails(enrollmentId) {
  const enrollment = enrollments.find((e) => e._id === enrollmentId);
  if (!enrollment) return;

  // Find associated student
  const student = students.find((s) => s._id === enrollment.studentId);

  // Find associated course
  const course = window.courses.find((c) => c._id === enrollment.courseId);

  if (!student || !course) {
    alert('Could not find complete enrollment details');
    return;
  }

  // Set modal title
  document.getElementById('enrollmentModalLabel').textContent =
    'Enrollment Details';

  // Populate enrollment details
  const detailsContainer = document.getElementById('enrollment-details');
  if (detailsContainer) {
    detailsContainer.innerHTML = `
      <div class="card mb-3">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Student Information</h5>
        </div>
        <div class="card-body">
          <p><strong>Name:</strong> ${student.name}</p>
          <p><strong>Student ID:</strong> ${student.studentId}</p>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Program:</strong> ${student.program || 'Not specified'}</p>
        </div>
      </div>
      
      <div class="card mb-3">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Course Information</h5>
        </div>
        <div class="card-body">
          <p><strong>Course Name:</strong> ${course.name}</p>
          <p><strong>Course Code:</strong> ${course.courseCode}</p>
          <p><strong>Credit Hours:</strong> ${course.creditHours}</p>
          <p><strong>Department:</strong> ${course.department}</p>
          <p><strong>Semester:</strong> ${course.semester}</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">Enrollment Information</h5>
        </div>
        <div class="card-body">
          <p><strong>Enrollment Date:</strong> ${new Date(
            enrollment.enrolledDate
          ).toLocaleDateString()}</p>
          <p><strong>Status:</strong> 
            <span class="badge bg-${
              enrollment.status === 'active'
                ? 'success'
                : enrollment.status === 'pending'
                ? 'warning'
                : 'secondary'
            }">
              ${enrollment.status}
            </span>
          </p>
          <p><strong>Grade:</strong> ${enrollment.grade || 'Not graded'}</p>
          <p><strong>Notes:</strong> ${
            enrollment.notes || 'No notes available'
          }</p>
        </div>
      </div>
    `;

    // Add status update options if the enrollment is not cancelled
    if (enrollment.status !== 'cancelled') {
      const statusUpdateContainer = document.createElement('div');
      statusUpdateContainer.className = 'mt-4';
      statusUpdateContainer.innerHTML = `
        <h5>Update Status</h5>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-success" onclick="updateEnrollmentStatus('${enrollmentId}', 'active')">
            Mark as Active
          </button>
          <button class="btn btn-warning" onclick="updateEnrollmentStatus('${enrollmentId}', 'pending')">
            Mark as Pending
          </button>
          <button class="btn btn-danger" onclick="updateEnrollmentStatus('${enrollmentId}', 'cancelled')">
            Cancel Enrollment
          </button>
        </div>
      `;
      detailsContainer.appendChild(statusUpdateContainer);
    }
  }

  // Show the modal
  const enrollmentModal = new bootstrap.Modal(
    document.getElementById('enrollmentModal')
  );
  enrollmentModal.show();
}

// Function to update enrollment status
async function updateEnrollmentStatus(enrollmentId, status) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/api/enrollments/${enrollmentId}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update enrollment status: ${response.status}`);
    }

    // Close the modal
    const enrollmentModal = bootstrap.Modal.getInstance(
      document.getElementById('enrollmentModal')
    );
    enrollmentModal.hide();

    // Reload enrollments
    await loadEnrollments();

    // Show success message
    alert(`Enrollment status updated to ${status}`);
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    alert(`Failed to update enrollment status: ${error.message}`);
  }
}

// Function to confirm enrollment cancellation
function confirmCancelEnrollment(enrollmentId) {
  if (
    confirm(
      'Are you sure you want to cancel this enrollment? This cannot be undone.'
    )
  ) {
    updateEnrollmentStatus(enrollmentId, 'cancelled');
  }
}

// Function to add a new enrollment
async function addNewEnrollment() {
  // Create a select for students
  const studentSelect = document.createElement('select');
  studentSelect.className = 'form-select mb-3';
  studentSelect.id = 'student-select';

  let studentOptions = '<option value="">Select a student</option>';
  students.forEach((student) => {
    studentOptions += `<option value="${student._id}">${student.name} (${student.studentId})</option>`;
  });
  studentSelect.innerHTML = studentOptions;

  // Create a select for courses
  const courseSelect = document.createElement('select');
  courseSelect.className = 'form-select mb-3';
  courseSelect.id = 'course-select';

  let courseOptions = '<option value="">Select a course</option>';
  window.courses.forEach((course) => {
    courseOptions += `<option value="${course._id}">${course.name} (${course.courseCode})</option>`;
  });
  courseSelect.innerHTML = courseOptions;

  // Create the form
  const form = document.createElement('form');
  form.id = 'enrollment-form';
  form.innerHTML = `
    <div class="mb-3">
      <label for="student-select" class="form-label">Student</label>
      ${studentSelect.outerHTML}
    </div>
    
    <div class="mb-3">
      <label for="course-select" class="form-label">Course</label>
      ${courseSelect.outerHTML}
    </div>
    
    <div class="mb-3">
      <label for="enrollment-notes" class="form-label">Notes (Optional)</label>
      <textarea class="form-control" id="enrollment-notes" rows="3"></textarea>
    </div>
  `;

  // Show the form in a modal
  Swal.fire({
    title: 'Add New Enrollment',
    html: form,
    showCancelButton: true,
    confirmButtonText: 'Enroll',
    focusConfirm: false,
    preConfirm: () => {
      const studentId = document.getElementById('student-select').value;
      const courseId = document.getElementById('course-select').value;
      const notes = document.getElementById('enrollment-notes').value;

      if (!studentId || !courseId) {
        Swal.showValidationMessage('Please select both a student and a course');
        return false;
      }

      return { studentId, courseId, notes };
    },
  }).then((result) => {
    if (result.isConfirmed) {
      createEnrollment(result.value);
    }
  });
}

// Function to create a new enrollment
async function createEnrollment(enrollmentData) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/api/enrollments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        studentId: enrollmentData.studentId,
        courseId: enrollmentData.courseId,
        notes: enrollmentData.notes,
        status: 'pending',
        enrolledDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create enrollment: ${response.status}`);
    }

    // Reload enrollments
    await loadEnrollments();

    // Show success message
    Swal.fire('Success!', 'Enrollment created successfully', 'success');
  } catch (error) {
    console.error('Error creating enrollment:', error);
    Swal.fire(
      'Error!',
      `Failed to create enrollment: ${error.message}`,
      'error'
    );
  }
}

document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOM loaded, initializing enrollments functionality');

  // Check if we're on a page with enrollment functionality
  const enrollmentsTab = document.getElementById('enrollments');
  const enrollmentsTableBody = document.getElementById(
    'enrollments-table-body'
  );
  const recentEnrollmentsElement =
    document.getElementById('recent-enrollments');

  if (enrollmentsTab || enrollmentsTableBody || recentEnrollmentsElement) {
    console.log('Enrollment elements found, loading data');

    // Make sure courses are loaded first
    if (!window.courses || window.courses.length === 0) {
      console.log('Courses not loaded yet, loading courses first');
      try {
        window.courses = await loadCourses();
      } catch (error) {
        console.error('Failed to load courses:', error);
      }
    }

    // Load enrollments
    try {
      await loadEnrollments();
      console.log('Enrollments loaded successfully');
    } catch (error) {
      console.error('Error loading enrollments:', error);
    }

    // Add event listeners for tab switching if we have tabs
    if (enrollmentsTab) {
      const tabLink = document.querySelector('a[href="#enrollments"]');
      if (tabLink) {
        tabLink.addEventListener('click', function () {
          console.log('Enrollments tab clicked, refreshing enrollments');
          loadEnrollments();
        });
      }

      // Add new enrollment button event listener
      const addEnrollmentBtn = document.getElementById('add-enrollment-btn');
      if (addEnrollmentBtn) {
        addEnrollmentBtn.addEventListener('click', addNewEnrollment);
      }
    }
  } else {
    console.log('No enrollment elements found in the DOM');
  }
});

// Add a function to manually render the enrollment tables for debugging
function forceRenderEnrollments() {
  console.log('Force rendering enrollments with data:', enrollments);
  updateEnrollmentsTable();
  updateRecentEnrollments();
}

// Ensure loadCourses is defined if not already
if (typeof loadCourses !== 'function') {
  async function loadCourses() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load courses: ${response.status}`);
      }

      const data = await response.json();
      console.log('Courses loaded:', data);
      window.courses = Array.isArray(data) ? data : [];
      return window.courses;
    } catch (error) {
      console.error('Error loading courses:', error);
      return [];
    }
  }
}
