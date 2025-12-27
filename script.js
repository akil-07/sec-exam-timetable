
const searchInput = document.getElementById('searchInput');
const loading = document.getElementById('loading');
const resultsArea = document.getElementById('resultsArea');
const errorMsg = document.getElementById('errorMsg');

let database = null;

async function initApp() {
    try {
        loading.classList.remove('hidden');
        document.querySelector('#loading p').textContent = "Loading database...";

        const response = await fetch('data.json');
        if (!response.ok) throw new Error("Failed to load data");

        database = await response.json();

        loading.classList.add('hidden');
        document.querySelector('#loading p').textContent = "Fetching schedule...";
        console.log("Database loaded.");
    } catch (e) {
        console.error(e);
        errorMsg.textContent = "Failed to load database. Please refresh.";
        loading.classList.add('hidden');
    }
}

async function fetchTimetable() {
    const refNo = searchInput.value.trim();

    errorMsg.textContent = '';
    resultsArea.classList.add('hidden');

    if (!refNo) {
        errorMsg.textContent = 'Please enter a Reference Number';
        return;
    }

    if (!database) {
        await initApp();
        if (!database) return;
    }

    loading.classList.remove('hidden');

    setTimeout(() => {
        const student = database[refNo];
        loading.classList.add('hidden');

        if (!student) {
            errorMsg.textContent = 'Invalid Reference Number. Please check and try again.';
            return;
        }

        if (student.theory.length === 0 && student.practical.length === 0) {
            errorMsg.textContent = 'No exams found for this student.';
        }

        renderTimetable(student);
    }, 300);
}

function renderTimetable(data) {
    const { studentName, regNo, theory, practical } = data;

    document.getElementById('studentName').textContent = studentName || 'Student';
    document.getElementById('displayRegNo').textContent = regNo;

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

if (searchInput) {
    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            fetchTimetable();
        }
    });
}

initApp();
