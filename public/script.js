const API_URL = '/api/timetable';

// DOM Elements
const searchInput = document.getElementById('searchInput');

// Initialize
// Clean up any old listeners or UI from previous name toggles if any remained (conceptually)

async function fetchTimetable() {
    const searchInput = document.getElementById('searchInput');
    const loading = document.getElementById('loading');
    const resultsArea = document.getElementById('resultsArea');
    const errorMsg = document.getElementById('errorMsg');
    const refNo = searchInput.value.trim();

    // Reset UI
    errorMsg.textContent = '';
    resultsArea.classList.add('hidden');

    if (!refNo) {
        errorMsg.textContent = 'Please enter a Reference Number';
        return;
    }

    loading.classList.remove('hidden');

    try {
        const response = await fetch(`${API_URL}?refNo=${encodeURIComponent(refNo)}`);
        const data = await response.json();

        loading.classList.add('hidden');

        if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch timetable');
        }

        renderTimetable(data, refNo);
    } catch (err) {
        loading.classList.add('hidden');
        errorMsg.textContent = err.message;
    }
}

function renderTimetable(data, refNo) {
    const { studentName, regNo, theory, practical } = data;

    // Update Student Info
    document.getElementById('studentName').textContent = studentName || 'Student';
    // Display the register number returned by the server, NOT the reference number used for search
    document.getElementById('displayRegNo').textContent = regNo;

    // Render Theory Table
    const theoryBody = document.querySelector('#theoryTable tbody');
    theoryBody.innerHTML = '';

    if (theory && theory.length > 0) {
        theory.forEach(exam => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span style="color: #fff; font-weight: 500;">${exam.date}</span></td>
                <td><span class="badge">${exam.session}</span></td>
                <td style="font-family: monospace; color: var(--text-dim);">${exam.courseCode}</td>
                <td>${exam.courseName}</td>
            `;
            theoryBody.appendChild(row);
        });
    } else {
        theoryBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 2rem;">No theory exams scheduled</td></tr>';
    }

    // Render Practical Table
    const practicalBody = document.querySelector('#practicalTable tbody');
    practicalBody.innerHTML = '';

    if (practical && practical.length > 0) {
        practical.forEach(exam => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span style="color: #fff; font-weight: 500;">${exam.date}</span></td>
                <td><span class="badge">${exam.session}</span></td>
                <td style="font-family: monospace; color: var(--text-dim);">${exam.courseCode}</td>
                <td>
                    <div style="font-weight: 500;">${exam.courseName}</div>
                    <div style="font-size: 0.85rem; color: var(--text-dim); margin-top: 4px;">📍 ${exam.location}</div>
                </td>
            `;
            practicalBody.appendChild(row);
        });
    } else {
        practicalBody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-dim); padding: 2rem;">No practical exams scheduled</td></tr>';
    }

    document.getElementById('resultsArea').classList.remove('hidden');
}

// Add enter key support
if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchTimetable();
        }
    });
}
