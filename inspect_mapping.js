const XLSX = require('xlsx');
const fs = require('fs');

const mappingFile = '2025-2029 UG Name List with Reg.No and UMIS No. 20.12.2025.xlsx';

function inspectMappingFile(filename) {
    if (!fs.existsSync(filename)) {
        console.log("File not found!");
        return;
    }
    let output = [];
    output.push(`--- Inspecting ${filename} ---`);
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    output.push("First 15 rows:");
    for (let i = 0; i < 15 && i < data.length; i++) {
        output.push(JSON.stringify(data[i]));
    }

    fs.writeFileSync('mapping_structure.txt', output.join('\n'));
}

inspectMappingFile(mappingFile);
