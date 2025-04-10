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

    // Try to get response as text first to debug any parsing issues
    const responseText = await response.text();
    console.log('Raw enrollment response:', responseText);

    // Parse the response text
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid JSON response from server');
    }

    console.log('Parsed enrollment data:', result);

    // Handle different response formats (array vs object with data property)
    let enrollmentData;
    if (Array.isArray(result)) {
      enrollmentData = result;
    } else if (result.data && Array.isArray(result.data)) {
      enrollmentData = result.data;
    } else if (result.enrollments && Array.isArray(result.enrollments)) {
      // Added this check for the 'enrollments' property
      enrollmentData = result.enrollments;
      console.log('Found enrollments array in response:', enrollmentData);
    } else if (result.status === 'success' && result.data) {
      enrollmentData = Array.isArray(result.data) ? result.data : [result.data];
    } else {
      console.warn('Unexpected enrollment data structure:', result);
      enrollmentData = [];
    }

    // Map the enrollment data to match the expected structure
    enrollments = enrollmentData.map((enrollment) => {
      // Extract student and course IDs safely
      const studentId =
        enrollment.student?._id || enrollment.student || enrollment.studentId;
      const courseId =
        enrollment.course?._id || enrollment.course || enrollment.courseId;

      // Handle both timestamp and enrolledDate fields
      const enrollDate =
        enrollment.enrolledDate ||
        enrollment.timestamp ||
        new Date().toISOString();

      return {
        _id: enrollment._id,
        student: enrollment.student,
        course: enrollment.course,
        studentId: studentId,
        courseId: courseId,
        status: enrollment.status || 'pending',
        enrolledDate: enrollDate,
        grade: enrollment.grade || null,
        notes: enrollment.notes || null,
      };
    });

    console.log('Processed enrollments:', enrollments);
    console.log('Available students:', students);
    console.log('Available courses:', window.courses);

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

  // Add debugging for the table body element
  console.log('Enrollment table body element:', tableBody);
  console.log('All table bodies on page:', document.querySelectorAll('tbody'));

  if (!tableBody) {
    console.warn(
      'Enrollments table body not found in the DOM. Looking for element with ID "enrollments-table-body"'
    );

    // Try to find the enrollments table and create tbody if missing
    const enrollmentsTable = document.querySelector('table.data-table');
    if (enrollmentsTable) {
      console.log('Found data table, checking if it has a tbody');
      let tbody = enrollmentsTable.querySelector('tbody');

      if (!tbody) {
        console.log(
          'No tbody found, creating one with id "enrollments-table-body"'
        );
        tbody = document.createElement('tbody');
        tbody.id = 'enrollments-table-body';
        enrollmentsTable.appendChild(tbody);
        tableBody = tbody;
      } else if (!tbody.id) {
        console.log(
          'Found tbody without ID, setting ID to "enrollments-table-body"'
        );
        tbody.id = 'enrollments-table-body';
        tableBody = tbody;
      }
    } else {
      console.error('No enrollment table found on the page');
      return;
    }
  }

  if (!enrollments || enrollments.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center">No enrollments found</td></tr>';
    return;
  }

  // Generate HTML with detailed debugging
  console.log('Building HTML for ' + enrollments.length + ' enrollments');
  let html = '';
  let skippedEnrollments = 0;
  let successfulRows = 0;

  for (let i = 0; i < enrollments.length; i++) {
    const enrollment = enrollments[i];
    console.log(`Processing enrollment ${i + 1}:`, enrollment);

    try {
      // Find associated student
      const student = students.find((s) => s._id === enrollment.studentId);
      console.log(`For enrollment ${i + 1} - Student found:`, student);

      // Find associated course
      const course = window.courses?.find((c) => c._id === enrollment.courseId);
      console.log(`For enrollment ${i + 1} - Course found:`, course);

      if (!student || !course) {
        console.warn(
          `Enrollment ${i + 1}: Missing student or course for enrollment:`,
          enrollment
        );
        console.log(
          `Enrollment ${i + 1}: Student found:`,
          student,
          'for ID:',
          enrollment.studentId
        );
        console.log(
          `Enrollment ${i + 1}: Course found:`,
          course,
          'for ID:',
          enrollment.courseId
        );
        skippedEnrollments++;

        // Create a fallback row with available information
        html += `
          <tr>
            <td>${
              student?.name || 'Student #' + enrollment.studentId || 'Unknown'
            }</td>
            <td>${student?.rollNo || 'N/A'}</td>
            <td>${
              course?.name || 'Course #' + enrollment.courseId || 'Unknown'
            }</td>
            <td>${course?.courseCode || 'N/A'}</td>
            <td>${new Date(
              enrollment.enrolledDate || enrollment.timestamp
            ).toLocaleDateString()}</td>
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
        continue;
      }

      const row = `
        <tr>
          <td>${student.name || 'Unknown'}</td>
          <td>${student.rollNo || 'N/A'}</td>
          <td>${course.name || 'Unknown'}</td>
          <td>${course.courseCode || 'N/A'}</td>
          <td>${new Date(
            enrollment.enrolledDate || enrollment.timestamp
          ).toLocaleDateString()}</td>
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
      html += row;
      successfulRows++;
    } catch (error) {
      console.error(`Error processing enrollment ${i + 1}:`, error);
      skippedEnrollments++;
    }
  }

  console.log(
    `Generated HTML for ${successfulRows} rows (skipped ${skippedEnrollments})`
  );
  console.log('HTML content length:', html.length);
  console.log('First 200 chars of HTML:', html.substring(0, 200));

  if (skippedEnrollments > 0) {
    console.warn(
      `Skipped ${skippedEnrollments} enrollments due to missing student or course data`
    );
  }

  // Apply the HTML to the table body
  try {
    console.log('Setting innerHTML on table body');
    tableBody.innerHTML = html;
    console.log(
      'Table body now contains',
      tableBody.children.length,
      'children'
    );
  } catch (error) {
    console.error('Error setting table body innerHTML:', error);

    // Fallback: try appending rows one by one
    console.log('Trying fallback method: creating nodes and appending');
    tableBody.innerHTML = '';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;

    const rows = tempDiv.querySelectorAll('tr');
    rows.forEach((row) => {
      tableBody.appendChild(row);
    });

    console.log(
      'Table body now contains',
      tableBody.children.length,
      'children after fallback'
    );
  }
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
      <div class="list-group-item">
        <div class="enrollment-header">
          <h5>${student.name}</h5>
          <small>${enrollmentDate}</small>
        </div>
        <p class="enrollment-course">Enrolled in ${course.name} (${
      course.courseCode
    })</p>
        <div class="enrollment-footer">
          <span>Student ID: ${student.rollNo}</span>
          <span class="badge ${getStatusBadgeClass(enrollment.status)}">
            ${enrollment.status}
          </span>
        </div>
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

  const modalContent = `
    <div class="modal" id="enrollmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="enrollmentModalLabel">Enrollment Details</h3>
          <button class="close-btn" onclick="hideModal('enrollmentModal')">&times;</button>
        </div>
        <div class="modal-body" id="enrollment-details">
          <div class="card">
            <div class="card-header primary">
              <h4>Student Information</h4>
            </div>
            <div class="card-body">
              <p><strong>Name:</strong> ${student.name}</p>
              <p><strong>Student ID:</strong> ${student.rollNo}</p>
              <p><strong>Email:</strong> ${student.email}</p>
              <p><strong>Department:</strong> ${
                student.department || 'Not specified'
              }</p>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header primary">
              <h4>Course Information</h4>
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
            <div class="card-header primary">
              <h4>Enrollment Information</h4>
            </div>
            <div class="card-body">
              <p><strong>Enrollment Date:</strong> ${new Date(
                enrollment.enrolledDate
              ).toLocaleDateString()}</p>
              <p><strong>Status:</strong> 
                <span class="badge ${getStatusBadgeClass(enrollment.status)}">
                  ${enrollment.status}
                </span>
              </p>
              <p><strong>Grade:</strong> ${enrollment.grade || 'Not graded'}</p>
              <p><strong>Notes:</strong> ${
                enrollment.notes || 'No notes available'
              }</p>
            </div>
          </div>
          
          ${
            enrollment.status !== 'cancelled'
              ? `
            <div class="status-actions">
              <h5>Update Status</h5>
              <div class="action-buttons">
                <button class="btn success" onclick="updateEnrollmentStatus('${enrollmentId}', 'active')">
                  Mark as Active
                </button>
                <button class="btn warning" onclick="updateEnrollmentStatus('${enrollmentId}', 'pending')">
                  Mark as Pending
                </button>
                <button class="btn danger" onclick="updateEnrollmentStatus('${enrollmentId}', 'cancelled')">
                  Cancel Enrollment
                </button>
              </div>
            </div>
          `
              : ''
          }
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="hideModal('enrollmentModal')">Close</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to body if it doesn't exist
  if (!document.getElementById('enrollmentModal')) {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalContent;
    document.body.appendChild(modalContainer.firstElementChild);
  } else {
    document.getElementById('enrollmentModal').innerHTML = modalContent;
  }

  // Show the modal
  showModal('enrollmentModal');
}

// Function to show a modal
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    modal.style.display = 'block';
    document.body.classList.add('modal-open');
  }
}

// Function to hide a modal
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
    modal.style.display = 'none';
    document.body.classList.remove('modal-open');
  }
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

    // Hide the modal
    hideModal('enrollmentModal');

    // Reload enrollments
    await loadEnrollments();

    // Show success message
    showAlert(`Enrollment status updated to ${status}`, 'success');
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    showAlert(`Failed to update enrollment status: ${error.message}`, 'danger');
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
  const modalContent = `
    <div class="modal" id="newEnrollmentModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Add New Enrollment</h3>
          <button class="close-btn" onclick="hideModal('newEnrollmentModal')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="enrollment-form">
            <div class="form-group">
              <label for="student-select">Student</label>
              <select id="student-select" required>
                <option value="">Select a student</option>
                ${students
                  .map(
                    (student) =>
                      `<option value="${student._id}">${student.name} (${student.rollNo})</option>`
                  )
                  .join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="course-select">Course</label>
              <select id="course-select" required>
                <option value="">Select a course</option>
                ${window.courses
                  .map(
                    (course) =>
                      `<option value="${course._id}">${course.name} (${course.courseCode})</option>`
                  )
                  .join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="enrollment-notes">Notes (Optional)</label>
              <textarea id="enrollment-notes" rows="3"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn secondary" onclick="hideModal('newEnrollmentModal')">Cancel</button>
          <button class="btn primary" onclick="submitEnrollment()">Enroll</button>
        </div>
      </div>
    </div>
  `;

  // Add modal to body if it doesn't exist
  if (!document.getElementById('newEnrollmentModal')) {
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalContent;
    document.body.appendChild(modalContainer.firstElementChild);
  } else {
    document.getElementById('newEnrollmentModal').innerHTML = modalContent;
  }

  // Show the modal
  showModal('newEnrollmentModal');
}

// Function to submit enrollment
function submitEnrollment() {
  const studentId = document.getElementById('student-select').value;
  const courseId = document.getElementById('course-select').value;
  const notes = document.getElementById('enrollment-notes').value;

  if (!studentId || !courseId) {
    showAlert('Please select both a student and a course', 'danger');
    return;
  }

  createEnrollment({ studentId, courseId, notes });
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
        enrolledDate: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create enrollment: ${response.status}`);
    }

    // Hide modal
    hideModal('newEnrollmentModal');

    // Reload enrollments
    await loadEnrollments();

    // Show success message
    showAlert('Enrollment created successfully', 'success');
  } catch (error) {
    console.error('Error creating enrollment:', error);
    showAlert(`Failed to create enrollment: ${error.message}`, 'danger');
  }
}

// Function to show alerts
function showAlert(message, type) {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert ${type}`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="close-btn" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(alertDiv);
  alertDiv.style.position = 'fixed';
  alertDiv.style.top = '20px';
  alertDiv.style.right = '20px';
  alertDiv.style.zIndex = '1000';

  setTimeout(() => {
    alertDiv.remove();
  }, 5000);
}

document.addEventListener('DOMContentLoaded', async function () {
  console.log('DOM loaded, initializing enrollments functionality');

  // Check if we're on a page with enrollment functionality
  let enrollmentsTab = document.getElementById('enrollments');
  let enrollmentsTableBody = document.getElementById('enrollments-table-body');
  let recentEnrollmentsElement = document.getElementById('recent-enrollments');

  // Extended check for table body in case it exists with a different ID
  if (!enrollmentsTableBody) {
    const enrollmentsTable = document.querySelector('table.data-table');
    if (enrollmentsTable) {
      enrollmentsTableBody = enrollmentsTable.querySelector('tbody');
      if (enrollmentsTableBody && !enrollmentsTableBody.id) {
        enrollmentsTableBody.id = 'enrollments-table-body';
      }
    }
  }

  console.log('Found elements:', {
    enrollmentsTab,
    enrollmentsTableBody,
    recentEnrollmentsElement,
  });

  if (enrollmentsTab || enrollmentsTableBody || recentEnrollmentsElement) {
    console.log('Enrollment elements found, loading data');

    try {
      // Load students first to ensure they are available
      await loadStudents();
      console.log('Students loaded, count:', students.length);

      // Make sure courses are loaded next
      if (!window.courses || window.courses.length === 0) {
        console.log('Courses not loaded yet, loading courses now');
        window.courses = await loadCourses();
        console.log('Courses loaded, count:', window.courses.length);
      }

      // Now load enrollments
      await loadEnrollments();
      console.log(
        'Enrollments loaded successfully, count:',
        enrollments.length
      );

      // Re-check if table body exists after loading data
      if (!document.getElementById('enrollments-table-body')) {
        console.log(
          'Table body still not found after loading data. Trying to find or create it.'
        );
        const enrollmentsTable = document.querySelector('table.data-table');
        if (enrollmentsTable) {
          let tbody = enrollmentsTable.querySelector('tbody');
          if (!tbody) {
            tbody = document.createElement('tbody');
            tbody.id = 'enrollments-table-body';
            enrollmentsTable.appendChild(tbody);
            console.log(
              'Created new tbody element with ID "enrollments-table-body"'
            );
          } else if (!tbody.id) {
            tbody.id = 'enrollments-table-body';
            console.log('Set ID of existing tbody to "enrollments-table-body"');
          }

          // Force re-render after creating/updating the table body
          updateEnrollmentsTable();
        }
      }

      // Direct DOM access for enrollments - add this to debug directly
      console.log('---FINAL TABLE CHECK---');
      const finalTable = document.querySelector('#enrollments-table-body');
      console.log('Final table element:', finalTable);
      if (finalTable) {
        console.log('Table content HTML:', finalTable.innerHTML);
        console.log('Table contains', finalTable.children.length, 'children');
      }

      // Try to force a re-render with a small delay
      setTimeout(() => {
        console.log('Forcing re-render after delay');
        forceRenderEnrollments();
      }, 1000);
    } catch (error) {
      console.error('Error during data loading:', error);
      showAlert('Error loading data: ' + error.message, 'danger');
    }

    // Add manual refresh button for debugging (temporary)
    const headerElement =
      document.querySelector('.section-header') ||
      document.querySelector('.card-header');
    if (headerElement) {
      const refreshBtn = document.createElement('button');
      refreshBtn.className = 'btn primary small';
      refreshBtn.innerHTML = 'Refresh Data';
      refreshBtn.style.marginLeft = '10px';
      refreshBtn.onclick = async () => {
        try {
          await loadStudents();
          await loadCourses();
          await loadEnrollments();
          showAlert('Data refreshed successfully', 'success');
        } catch (e) {
          showAlert('Error refreshing data: ' + e.message, 'danger');
        }
      };
      headerElement.appendChild(refreshBtn);
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

      const responseText = await response.text();
      let data;

      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse courses data:', responseText, e);
        return [];
      }

      console.log('Courses loaded:', data);

      if (Array.isArray(data)) {
        window.courses = data;
      } else if (
        data &&
        data.status === 'success' &&
        Array.isArray(data.data)
      ) {
        window.courses = data.data;
      } else {
        console.warn('Unexpected courses data format:', data);
        window.courses = [];
      }

      return window.courses;
    } catch (error) {
      console.error('Error loading courses:', error);
      return [];
    }
  }
}
