const express = require('express');
const cors = require('cors');
const XLSX = require('xlsx');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.static('public'));

const theoryFile = 'All UG End Semester Theory Examination Time Table Nov 2025 I Sem (Term - II).xlsx';
const practicalFile = 'All UG End Semester Practical Examination Time Table Nov 2025 I Sem (Term - II).xlsx';
const mappingFile = '2025-2029 UG Name List with Reg.No and UMIS No. 20.12.2025.xlsx';

// Load Mapping Data
let refToRegMap = {};
if (require('fs').existsSync(mappingFile)) {
    console.log("Loading student mapping...");
    const workbook = XLSX.readFile(mappingFile);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Header is at index 8 (Row 9) in the specific file provided
    // Data starts after. We need to be careful.
    // Based on inspection:
    // Row 9 (Index 8) is header: ["Sl. No.", ... "Reference Number", "Register Number", ...]
    // "Reference Number" is index 3
    // "Register Number" is index 4

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        // Ensure row has enough columns and looks like data (e.g., Sl. No. is a number or string number)
        if (row && row.length > 4) {
            const refNo = String(row[3]).trim();
            const regNo = String(row[4]).trim();
            // Basic validation: both should be non-empty and not the header itself
            if (refNo && regNo && refNo !== 'Reference Number') {
                refToRegMap[refNo] = regNo;
            }
        }
    }
    console.log(`Loaded ${Object.keys(refToRegMap).length} student mappings.`);
    console.log("Sample Keys:", Object.keys(refToRegMap).slice(0, 5));
    console.log("Sample Value for '25019213':", refToRegMap['25019213']);
} else {
    console.warn("Mapping file not found!");
}

// Helper to read and filter excel
function getExams(filePath, regNo, examType) {
    if (!require('fs').existsSync(filePath)) {
        return [];
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    const targetRegNo = String(regNo).trim();

    return data.filter(row => {
        const rowRegNo = row['Reg. No.'] ? String(row['Reg. No.']).trim() : '';
        return rowRegNo === targetRegNo;
    }).map(row => ({
        date: row['Date'],
        session: row['Session'],
        courseCode: row['R - 2024'] || row['R - 2019'],
        courseName: row['Course Name'],
        location: examType === 'practical' ? row['Location'] : 'N/A',
        type: examType
    }));
}

app.get('/api/timetable', (req, res) => {
    const refNo = req.query.refNo;
    console.log(`[REQUEST] /api/timetable called with refNo: '${refNo}'`);

    if (!refNo) {
        return res.status(400).json({ error: 'Reference Number is required' });
    }

    const inputRef = String(refNo).trim();
    const regNo = refToRegMap[inputRef];

    console.log(`[LOOKUP] '${inputRef}' resolves to '${regNo}'`);

    if (!regNo) {
        console.log(`Failed lookup for refNo: '${inputRef}'. Keys available: ${Object.keys(refToRegMap).slice(0, 5)}`);
        return res.status(404).json({ error: 'Invalid Reference Number. Please check and try again.' });
    }

    console.log(`Reference No: ${inputRef} -> Register No: ${regNo}`);

    const theoryData = getExams(theoryFile, regNo, 'theory');
    const practicalData = getExams(practicalFile, regNo, 'practical');

    // Extract student name
    let studentName = "";

    // Quick lookup for name using Reg No
    const wbTheory = XLSX.readFile(theoryFile);
    const rawTheory = XLSX.utils.sheet_to_json(wbTheory.Sheets[wbTheory.SheetNames[0]]);
    const wbPractical = XLSX.readFile(practicalFile);
    const rawPractical = XLSX.utils.sheet_to_json(wbPractical.Sheets[wbPractical.SheetNames[0]]);

    const targetRegNo = String(regNo).trim();
    const studentEntry = rawTheory.find(row => String(row['Reg. No.']).trim() === targetRegNo) ||
        rawPractical.find(row => String(row['Reg. No.']).trim() === targetRegNo);

    if (studentEntry) {
        studentName = studentEntry['Student Name'];
    }

    if (theoryData.length === 0 && practicalData.length === 0) {
        return res.status(404).json({ error: 'No exams found for this student.' });
    }

    res.json({
        studentName,
        regNo, // Send regNo back to display
        theory: theoryData,
        practical: practicalData
    });
});

app.listen(port, () => {
    console.log(`Exam Timetable Generator running at http://localhost:${port}`);
});
