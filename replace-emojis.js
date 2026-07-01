const fs = require('fs');

const map = {
  "🐑": "<Icons.SheepIcon />",
  "📋": "<Icons.CopyIcon />",
  "🌸": "<Icons.FlowerIcon />",
  "🕋": "<Icons.KaabaIcon />",
  "🤲": "<Icons.HandsPrayIcon />",
  "🕊️": "<Icons.BirdIcon />",
  "🏃": "<Icons.RunIcon />",
  "⛺": "<Icons.TentIcon />",
  "🌅": "<Icons.SunriseIcon />",
  "🌙": "<Icons.CrescentIcon />",
  "💎": "<Icons.DiamondIcon />",
  "✂️": "<Icons.ScissorsIcon />",
  "👋": "<Icons.WaveIcon />",
  "📄": "<Icons.DocumentIcon />",
  "👘": "<Icons.ShirtIcon />",
  "💊": "<Icons.PillIcon />",
  "📿": "<Icons.BeadsIcon />",
  "📱": "<Icons.PhoneIcon />",
  "⚠️": "<Icons.WarningIcon />",
  "⏰": "<Icons.ClockIcon />",
  "😤": "<Icons.FaceIcon />",
  "💧": "<Icons.DropIcon />",
  "📵": "<Icons.PhoneIcon />",
  "🗺️": "<Icons.MapIcon />",
  "🧼": "<Icons.SoapIcon />",
  "💬": "<Icons.ChatIcon />",
  "📣": "<Icons.MegaphoneIcon />",
  "🕌": "<Icons.MosqueIcon />",
  "🎉": "<Icons.PartyIcon />",
  "✓": "<Icons.CheckIcon />",
  "✕": "<Icons.CrossIcon />",
  "📍": "<Icons.LocationIcon />",
  "🎨": "<Icons.PaletteIcon />",
  "✍️": "<Icons.PenIcon />",
  "🔊": "<Icons.SpeakerIcon />",
  "📖": "<Icons.BookIcon />",
  "🎙️": "<Icons.MicIcon />",
  "🎵": "<Icons.NoteIcon />",
  "☀️": "<Icons.SunIcon />",
  "✅": "<Icons.CheckIcon />",
  "✨": "<Icons.SparkleIcon />",
  "🌄": "<Icons.SunriseIcon />",
  "⏸️": "<Icons.PauseIcon />",
  "○": "<Icons.CircleIcon />"
};

const importStmt = "import * as Icons from '../../components/IconLibrary';\n";
const importStmtRoot = "import * as Icons from '../components/IconLibrary';\n";

const files = [
    'src/features/hajj/HajjGuide.jsx',
    'src/features/hajj/hajjData.jsx',
    'src/features/more/SettingsPage.jsx',
    'src/features/prayer/PrayerTimes.jsx',
    'src/features/qibla/QiblaFinder.jsx',
    'src/features/quran/ReadingSettingsModal.jsx',
    'src/features/ratheeb/RatheebHaddad.jsx',
    'src/features/tasbih/TasbihCounter.jsx',
    'src/features/umrah/UmrahGuide.jsx',
    'src/features/umrah/umrahData.jsx'
];

for (const file of files) {
    if (!fs.existsSync(file)) {
        console.log("Missing:", file);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    
    // Add import statement if it doesn't exist
    if (!content.includes('IconLibrary')) {
        if (file.startsWith('src/features/')) {
            content = importStmt + content;
        } else if (file.startsWith('src/App')) {
            content = importStmtRoot + content;
        }
    }
    
    for (const [emoji, svg] of Object.entries(map)) {
        // Find literal exact matches in quotes, e.g. "🌙" or '🌙' or `🌙`
        const regexExactQuote = new RegExp(`(["'\`])${emoji}\\1`, 'g');
        content = content.replace(regexExactQuote, svg);
        
        // Find occurrences where it's embedded in strings e.g. "Text 🌙"
        // Replace ONLY the emoji with a JSX wrapper, breaking the string into JSX?
        // Wait, for these files, the emojis are usually exact matches like icon: "🌙"
        // Or inline like <span className="icon">🌙</span>
        const regexInline = new RegExp(`${emoji}`, 'g');
        content = content.replace(regexInline, svg);
    }
    fs.writeFileSync(file, content);
}
console.log("Done");
