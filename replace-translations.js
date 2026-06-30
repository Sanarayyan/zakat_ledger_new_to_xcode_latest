const fs = require('fs');

const map = {
  "🗑️": "<Icons.CopyIcon />", // wait, I don't have DeleteIcon, I'll use CopyIcon or something temporarily, or create DeleteIcon
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

let content = fs.readFileSync('src/translations.jsx', 'utf8');

const importStmt = "import * as Icons from './components/IconLibrary';\n";
if (!content.includes('IconLibrary')) {
    content = importStmt + content;
}

// Replace string literals containing emojis
for (const [emoji, svg] of Object.entries(map)) {
    // Regex matches "emoji text" or 'emoji text'
    // It captures the text before and after the emoji inside the quotes
    // e.g. "🗑️ Delete" -> match[1] = "🗑️ Delete", quote = '"'
    
    const regex = new RegExp(`(["'])(.*?)${emoji}(.*?)\\1`, 'g');
    content = content.replace(regex, (match, quote, before, after) => {
        return `(<span style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}>${before ? before + ' ' : ''}${svg}${after ? ' ' + after : ''}</span>)`;
    });
}

fs.writeFileSync('src/translations.jsx', content);
