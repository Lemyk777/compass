const fs = require('fs');
const path = require('path');

const rawDir = path.join(__dirname, 'data-pipeline', 'raw');
const files = ['page1.json', 'search1.json'];

for (const file of files) {
  const filePath = path.join(rawDir, file);
  if (!fs.existsSync(filePath)) continue;
  
  const raw = fs.readFileSync(filePath, 'utf8');
  const jsonStart = raw.indexOf('{"kind"');
  if (jsonStart === -1) { console.log('No JSON in ' + file); continue; }
  
  let jsonStr = raw.substring(jsonStart);
  
  // Show problem area
  const pos = file === 'page1.json' ? 204371 : 219813;
  const start = Math.max(0, pos - 50);
  const end = Math.min(jsonStr.length, pos + 50);
  const snippet = jsonStr.substring(start, end);
  console.log(file + ' problem at pos ' + pos + ':');
  console.log('  Chars around issue:');
  for (let i = 0; i < snippet.length; i++) {
    const code = snippet.charCodeAt(i);
    if (code < 32) {
      console.log('  CONTROL CHAR at offset ' + (start + i) + ': 0x' + code.toString(16));
    }
  }
  
  // Aggressive cleanup: replace ALL control chars except \n \r \t
  // Also handle within JSON strings by replacing them
  jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  try {
    const json = JSON.parse(jsonStr);
    console.log(file + ': PARSED OK! children: ' + json.data.children.length);
    
    // Re-save as clean JSON
    const cleanPath = path.join(rawDir, file.replace('.json', '_clean.json'));
    fs.writeFileSync(cleanPath, JSON.stringify(json));
    console.log('Saved clean version: ' + cleanPath);
  } catch (err) {
    console.log(file + ': Still fails: ' + err.message.substring(0, 150));
    
    // Try a different approach: manual extraction using regex
    console.log('Trying regex extraction...');
    const idMatches = jsonStr.match(/"id"\s*:\s*"([^"]+)"/g);
    const titleMatches = jsonStr.match(/"title"\s*:\s*"([^"]{5,200})"/g);
    console.log('  Found ' + (idMatches ? idMatches.length : 0) + ' id fields');
    console.log('  Found ' + (titleMatches ? titleMatches.length : 0) + ' title fields');
  }
}
