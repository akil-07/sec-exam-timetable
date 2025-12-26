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

const db = {};

mapData.forEach((row, idx) => {
    if (row && row.length > 4) {
        const ref = String(row[3]).trim();
        const reg = String(row[4]).trim();
        const name = row[6] ? String(row[6]).trim() : "Student";

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

const regToRef = {};
Object.keys(db).forEach(ref => {
    regToRef[db[ref].regNo] = ref;
});

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

console.log("Writing data.json...");
fs.writeFileSync('data.json', JSON.stringify(db));
console.log("Done!");
