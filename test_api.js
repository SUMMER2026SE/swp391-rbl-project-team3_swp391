const axios = require('axios');

axios.get('http://localhost:8080/api/courses')
  .then(res => console.log(JSON.stringify(res.data, null, 2)))
  .catch(err => console.error(err));
