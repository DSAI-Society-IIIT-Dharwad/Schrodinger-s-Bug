const fs = require('fs');
try {
  const data = fs.readFileSync('public/leo_rover.glb');
  const str = data.toString('utf8');
  const jsonStart = str.indexOf('{');
  if (jsonStart !== -1) {
    let brackets = 0;
    let jsonEnd = -1;
    for (let i = jsonStart; i < str.length; i++) {
        if (str[i] === '{') brackets++;
        else if (str[i] === '}') brackets--;
        if (brackets === 0) {
            jsonEnd = i + 1;
            break;
        }
    }
    if (jsonEnd !== -1) {
        const jsonStr = str.slice(jsonStart, jsonEnd);
        const obj = JSON.parse(jsonStr);
        if (obj.nodes) {
            console.log(obj.nodes.map(n => n.name).filter(Boolean).join('\n'));
        }
    }
  }
} catch (e) {
  console.error(e);
}
