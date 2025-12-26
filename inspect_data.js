const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const theoryFile = 'All UG End Semester Theory Examination Time Table Nov 2025 I Sem (Term - II).xlsx';
const practicalFile = 'All UG End Semester Practical Examination Time Table Nov 2025 I Sem (Term - II).xlsx';

function inspectFile(filename) {
    if (!fs.existsSync(filename)) {
        console.log("File not found: " + filename);
        return;
    }
    let output = [];
    output.push(`--- Inspecting ${filename} ---`);
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    output.push("First 5 rows:");
    for (let i = 0; i < 5 && i < data.length; i++) {
        output.push(JSON.stringify(data[i]));
    }

    const nonEmptyRows = data.filter(r => r.length > 0);
    if (nonEmptyRows.length > 6) {
        output.push("\nSample Data (Row 6 of non-empty):", JSON.stringify(nonEmptyRows[5]));
    }

    fs.appendFileSync('structure_info.txt', output.join('\n') + '\n\n');
}

if (fs.existsSync('structure_info.txt')) fs.unlinkSync('structure_info.txt');
inspectFile(theoryFile);
inspectFile(practicalFile);
