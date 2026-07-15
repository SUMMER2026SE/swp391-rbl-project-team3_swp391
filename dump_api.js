const axios = require('axios');
const fs = require('fs');

async function checkApi() {
    try {
        const courses = await axios.get('http://localhost:8080/api/courses');
        const subjects = await axios.get('http://localhost:8080/api/public/subjects');
        
        fs.writeFileSync('api_dump.json', JSON.stringify({
            courses: courses.data,
            subjects: subjects.data
        }, null, 2));
        console.log("Done");
    } catch (err) {
        console.error(err);
    }
}
checkApi();
