var fs = require('fs');
fs.writeFile("test.json", jsonData, function(err) {
    if (err) {
        console.log(err);
    }
});
