const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const theoryFile = 'All UG End Semester Theory Examination Time Table Nov 2025 I Sem (Term - II).xlsx';
const practicalFile = 'All UG End Semester Practical Examination Time Table Nov 2025 I Sem (Term - II).xlsx';
const mappingFile = '2025-2029 UG Name List with Reg.No and UMIS No. 20.12.2025.xlsx';

console.log("Reading Excel files...");

function readExcel(file) {
    if (!fs.existsSync(file)) return [];
    const wb = XLSX.readFile(file);
    return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
}

const mapData = XLSX.utils.sheet_to_json(XLSX.readFile(mappingFile).Sheets[XLSX.readFile(mappingFile).SheetNames[0]], { header: 1 });
const theoryData = readExcel(theoryFile);
const practicalData = readExcel(practicalFile);

console.log("Processing data...");

// 1. Build Mapping and Student Base
const db = {}; // Key: Reference Number

// mapData structure: Row 9 (index 8) is header.
// Index 3: Ref, Index 4: Reg, Index 6: Name
mapData.forEach((row, idx) => {
    if (row && row.length > 4) {
        const ref = String(row[3]).trim();
        const reg = String(row[4]).trim();
        const name = row[6] ? String(row[6]).trim() : "Student";

        // Validate
        if (ref && reg && ref !== 'Reference Number') {
            db[ref] = {
                studentName: name,
                regNo: reg,
                theory: [],
                practical: []
            };
        }
    }
});

console.log(`Found ${Object.keys(db).length} students.`);

// Helper to find student by regNo
// We need a RegNo -> RefNo reverse lookup to easily slot exams
const regToRef = {};
Object.keys(db).forEach(ref => {
    regToRef[db[ref].regNo] = ref;
});

// 2. Add Theory Exams
theoryData.forEach(row => {
    const reg = row['Reg. No.'] ? String(row['Reg. No.']).trim() : '';
    if (regToRef[reg]) {
        const ref = regToRef[reg];
        db[ref].theory.push({
            date: row['Date'],
            session: row['Session'],
            courseCode: row['R - 2024'] || row['R - 2019'],
            courseName: row['Course Name']
        });
    }
});

// 3. Add Practical Exams
practicalData.forEach(row => {
    const reg = row['Reg. No.'] ? String(row['Reg. No.']).trim() : '';
    if (regToRef[reg]) {
        const ref = regToRef[reg];
        db[ref].practical.push({
            date: row['Date'],
            session: row['Session'],
            courseCode: row['R - 2024'] || row['R - 2019'],
            courseName: row['Course Name'],
            location: row['Location']
        });
    }
});

console.log("Writing public/data.json...");
fs.writeFileSync('public/data.json', JSON.stringify(db));
console.log("Done!");
