const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src/features/dashboard/Dashboard.css');
let content = fs.readFileSync(cssPath, 'utf8');

// 1. Fix bottom navigation span text wrapping
content = content.replace(
    /\.dash-nav-item span \{([\s\S]*?)\}/,
    `.dash-nav-item span {
    font-size: 0.7rem;
    font-weight: 600;
    text-align: center;
    max-width: 100%;
    word-break: break-word;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: normal;
    line-height: 1.15;
}`
);

// Fix dash-nav-item flex basis
content = content.replace(
    /\.dash-nav-item \{([\s\S]*?)flex: 1;([\s\S]*?)\}/,
    (match, p1, p2) => `.dash-nav-item {${p1}flex: 1 1 0;${p2}}`
);

// 2. Fix prayer streak card top row wrapping
content = content.replace(
    /\.dsc-top-row \{([\s\S]*?)\}/,
    `.dsc-top-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}`
);

// Add min-width to dsc-streak and dsc-progress
content = content.replace(
    /\.dsc-streak \{([\s\S]*?)\}/,
    `.dsc-streak {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}`
);
content = content.replace(
    /\.dsc-progress \{([\s\S]*?)\}/,
    `.dsc-progress {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
}`
);

// 3. Fix Dash Feature Text h3 (Quran card)
content = content.replace(
    /\.dash-feature-text-bottom h3 \{([\s\S]*?)\}/,
    `.dash-feature-text-bottom h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--dash-text-main);
    word-break: break-word;
    overflow-wrap: break-word;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.2;
}`
);

// 4. Fix Shortcut Cards
content = content.replace(
    /min-height: 110px;/g,
    'min-height: 120px;'
);
content = content.replace(
    /\.shortcut-card \{([\s\S]*?)padding: 18px 8px;([\s\S]*?)\}/,
    (match, p1, p2) => `.shortcut-card {${p1}padding: 16px 4px;${p2}}`
);

// Change shortcut label line clamp to 3 just in case
content = content.replace(
    /\.shortcut-label \{([\s\S]*?)-webkit-line-clamp: 2;([\s\S]*?)\}/,
    (match, p1, p2) => `.shortcut-label {${p1}-webkit-line-clamp: 3;${p2}}`
);

fs.writeFileSync(cssPath, content, 'utf8');
console.log('CSS fixed successfully!');
