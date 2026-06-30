const fs = require('fs');

const map = {
  "🌙": "<Icons.CrescentIcon />"
};

const importStmt = "import * as Icons from '../../components/IconLibrary';\n";

const files = [
    'src/features/dashboard/Dashboard.jsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    
    if (!content.includes('IconLibrary')) {
        content = importStmt + content;
    }
    
    for (const [emoji, svg] of Object.entries(map)) {
        const regexExactQuote = new RegExp(`(["'\`])${emoji}\\1`, 'g');
        content = content.replace(regexExactQuote, svg);
        
        const regexInline = new RegExp(`${emoji}`, 'g');
        content = content.replace(regexInline, svg);
    }
    fs.writeFileSync(file, content);
}
console.log("Done Dashboard");
