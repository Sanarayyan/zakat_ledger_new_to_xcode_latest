const fs = require('fs');
const path = require('path');

// This script simulates a terminal admin panel by reading data that would be in a browser's localStorage
// Note: In a real web app, localStorage is browser-only. 
// For this local dev environment, we will look for a JSON file that mimics the aggregate data if exported, 
// OR we will provide a template for how the admin can query the local storage data via the browser console.

console.log('\x1b[36m%s\x1b[0m', '--- ZakatLedger Terminal Admin Panel ---');
console.log('Status: Developer mode active\n');

/**
 * Instruction for the Developer:
 * Since localStorage is scoped to the browser, you can run the following command 
 * in your Browser Console (F12) to get the same Terminal-style output 
 * that only you as the developer will know how to trigger.
 */

const adminScript = `
(function() {
    console.log("%c--- ZakatLedger Global Admin Audit ---", "color: #00d2ff; font-weight: bold; font-size: 16px;");
    let totalAmount = 0;
    let users = [];
    let recipients = new Set();

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('zakat_records_')) {
            const email = key.replace('zakat_records_', '');
            const records = JSON.parse(localStorage.getItem(key)) || [];
            const userTotal = records.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
            
            users.push({ email, count: records.length, total: userTotal });
            totalAmount += userTotal;
            records.forEach(r => recipients.add(r.recipient));
        }
    }

    console.table(users);
    console.log("%cTotal Donated: ₹" + totalAmount.toLocaleString(), "color: #10b981; font-weight: bold;");
    console.log("%cTotal Donors: " + users.length, "color: #3a7bd5;");
    console.log("%cUnique Recipients: " + recipients.size, "color: #f43f5e;");
})();
`;

console.log('To run the Admin Audit, copy and paste the following code into your Browser Console:');
console.log('--------------------------------------------------------------------------------');
console.log(adminScript);
console.log('--------------------------------------------------------------------------------');
