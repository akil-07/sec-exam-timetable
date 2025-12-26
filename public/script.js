
// DOM Elements
const searchInput = document.getElementById('searchInput');
const loading = document.getElementById('loading');
const resultsArea = document.getElementById('resultsArea');
const errorMsg = document.getElementById('errorMsg');

// State for data
let theoryData = null;
let practicalData = null;
let mappingData = {};
let isDataLoaded = false;

// Initialize and Load Data
async function loadData() {
    try {
        loading.classList.remove('hidden');
        document.querySelector('#loading p').textContent = "Loading exam databases...";

        // Fetch all files in parallel
        const [theoryBuf, practicalBuf, mappingBuf] = await Promise.all([
            fetch('theory.xlsx').then(res => res.arrayBuffer()),
            fetch('practical.xlsx').then(res => res.arrayBuffer()),
            fetch('mapping.xlsx').then(res => res.arrayBuffer())
        ]);

        // Process Mapping
        const mapWb = XLSX.read(mappingBuf, { type: 'array' });
        const mapSheet = mapWb.Sheets[mapWb.SheetNames[0]];
        const mapJson = XLSX.utils.sheet_to_json(mapSheet, { header: 1 });

        // Build Mapping Dictionary
        // Index 3: Ref, Index 4: Reg
        mapJson.forEach(row => {
            if (row.length > 4) {
                const ref = String(row[3]).trim();
                const reg = String(row[4]).trim();
                if (ref && reg && ref !== 'Reference Number') {
                    mappingData[ref] = reg;
                }
            }
        });

        // Process Exams
        const thWb = XLSX.read(theoryBuf, { type: 'array' });
        theoryData = XLSX.utils.sheet_to_json(thWb.Sheets[thWb.SheetNames[0]]);

        const prWb = XLSX.read(practicalBuf, { type: 'array' });
        practicalData = XLSX.utils.sheet_to_json(prWb.Sheets[prWb.SheetNames[0]]);

        isDataLoaded = true;
        loading.classList.add('hidden');
        document.querySelector('#loading p').textContent = "Fetching schedule..."; // Reset text
        console.log("Data loaded successfully");

    } catch (error) {
        console.error("Error loading data:", error);
        loading.classList.add('hidden');
        errorMsg.textContent = "Failed to load exam databases. Please refresh.";
    }
}

// Helper to filter exams
function getStudentExams(regNo, data, type) {
    const target = String(regNo).trim();
    return data.filter(row => {
        const r = row['Reg. No.'] ? String(row['Reg. No.']).trim() : '';
        return r === target;
    }).map(row => ({
        date: row['Date'],
        session: row['Session'],
        courseCode: row['R - 2024'] || row['R - 2019'],
        courseName: row['Course Name'],
        location: type === 'practical' ? row['Location'] : 'N/A',
        studentName: row['Student Name']
    }));
}

async function fetchTimetable() {
    const refNo = searchInput.value.trim();

    // Reset UI
    errorMsg.textContent = '';
    resultsArea.classList.add('hidden');

    if (!refNo) {
        errorMsg.textContent = 'Please enter a Reference Number';
        return;
    }

    if (!isDataLoaded) {
        await loadData();
        if (!isDataLoaded) return; // Stop if load failed
    }

    // Client Side Search Logic
    const regNo = mappingData[refNo];

    if (!regNo) {
        errorMsg.textContent = 'Invalid Reference Number. Please check and try again.';
        return;
    }

    const theory = getStudentExams(regNo, theoryData, 'theory');
    const practical = getStudentExams(regNo, practicalData, 'practical');

    if (theory.length === 0 && practical.length === 0) {
        errorMsg.textContent = 'No exams found for this student.';
        return;
    }

    // Get Name from first exam entry
    let studentName = "";
    if (theory.length > 0) studentName = theory[0].studentName;
    else if (practical.length > 0) studentName = practical[0].studentName;

    renderTimetable({
        studentName,
        regNo,
        theory,
        practical
    });
}

function renderTimetable(data) {
    const { studentName, regNo, theory, practical } = data;

    // Update Student Info
    document.getElementById('studentName').textContent = studentName || 'Student';
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

// Prefetch data on load for speed
loadData();
