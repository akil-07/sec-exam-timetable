const XLSX = require('xlsx');
const mappingFile = '2025-2029 UG Name List with Reg.No and UMIS No. 20.12.2025.xlsx';

console.log("Reading mapping file...");
const workbook = XLSX.readFile(mappingFile);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

let map = {};
// We found data starts looking like data around row 9 (index 8)
// Indices: 3 -> Ref, 4 -> Reg
data.forEach((row, idx) => {
    if (row && row.length > 4) {
        const refRaw = row[3];
        const regRaw = row[4];

        if (refRaw && regRaw) {
            const ref = String(refRaw).trim();
            const reg = String(regRaw).trim();
            map[ref] = reg;

            // Debug specific known IDs
            if (ref.includes('25019213') || ref.includes('25019163')) {
                console.log(`Found Target at Row ${idx}: ${ref} -> ${reg}`);
            }
        }
    }
});

console.log("Total mapped:", Object.keys(map).length);
console.log("Check '25019213':", map['25019213']);
