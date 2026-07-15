const fs = require('fs');
const path = require('path');

const dir = 'd:/SWP project/PrepAce_Ai/thang-frontend/src/pages/jsx';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.includes('Mathematics') || content.includes('Tất cả môn học') || content.includes('subjects.map')) {
        console.log(file);
    }
});
