const fs = require('fs');
const path = require('path');

const transPath = path.join(__dirname, 'src/translations.js');
let content = fs.readFileSync(transPath, 'utf8');

const enKeys = `
        coming_soon: "Coming Soon",
        coming_soon_inshaallah: "Coming Soon, In Sha Allah",
        rate_title: "Enjoying Muslim Plus?",
        rate_desc: "Your rating helps us improve and reach more people.",
        rate_submit: "Submit Rating",
        rate_later: "Maybe Later",
        rate_thank_you: "Thank you for your feedback!",
        rate_btn: "Rate App",
        update_available_title: "Update Available",
        update_required_title: "Update Required",
        update_desc_soft: "A new version of Muslim Plus is available. Update now to enjoy the latest features and improvements.",
        update_desc_force: "Please update the app to continue using it. This update includes critical improvements.",
        update_now: "Update Now",
        update_later: "Later",
`;

const mlKeys = `
        coming_soon: "ഉടൻ വരുന്നു",
        coming_soon_inshaallah: "ഉടൻ വരുന്നു, ഇൻഷാ അല്ലാഹ്",
        rate_title: "സകാത്ത് ലെഡ്ജർ ഉപയോഗപ്രദമാണോ?",
        rate_desc: "നിങ്ങളുടെ റേറ്റിംഗ് ഞങ്ങളെ മെച്ചപ്പെടുത്താൻ സഹായിക്കും.",
        rate_submit: "റേറ്റിംഗ് സമർപ്പിക്കുക",
        rate_later: "പിന്നീടാകാം",
        rate_thank_you: "നിങ്ങളുടെ അഭിപ്രായത്തിന് നന്ദി!",
        rate_btn: "ആപ്പ് റേറ്റ് ചെയ്യുക",
        update_available_title: "അപ്ഡേറ്റ് ലഭ്യമാണ്",
        update_required_title: "അപ്ഡേറ്റ് ആവശ്യമാണ്",
        update_desc_soft: "സകാത്ത് ലെഡ്ജറിന്റെ പുതിയ പതിപ്പ് ലഭ്യമാണ്. പുതിയ ഫീച്ചറുകൾ ലഭിക്കാൻ ഇപ്പോൾ അപ്ഡേറ്റ് ചെയ്യുക.",
        update_desc_force: "തുടർന്ന് ഉപയോഗിക്കാൻ ആപ്പ് അപ്ഡേറ്റ് ചെയ്യുക. ഇതിൽ പ്രധാനപ്പെട്ട മാറ്റങ്ങൾ ഉൾപ്പെടുന്നു.",
        update_now: "ഇപ്പോൾ അപ്ഡേറ്റ് ചെയ്യുക",
        update_later: "പിന്നീട്",
`;

// Insert keys into EN object
content = content.replace(/(en:\s*{[\s\S]*?)(};)/, (match, p1) => {
    return p1 + enKeys + "    },\n";
});

// Insert keys into ML object
content = content.replace(/(ml:\s*{[\s\S]*?)(};)/, (match, p1) => {
    return p1 + mlKeys + "    }\n";
});

fs.writeFileSync(transPath, content, 'utf8');
console.log('Translations updated!');
