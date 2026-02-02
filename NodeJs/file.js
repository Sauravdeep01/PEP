const fs = require('fs');
const http = require('http');

const server = http.createServer((req, res) => {

    fs.readFile('new.txt', 'utf-8', (err,data) => {
        if(err) res.end('File not found');
        else res.end(data);
    })
    
});

server.listen(4000, () => {
    console.log("Server running at port 4000");
});
