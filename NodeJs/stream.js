const fs = require('fs');
const http = require('http');

const server = http.createServer((req, res) => {

    const stream = fs.createReadStream('new.txt', 'utf-8');

    stream.on('data', (chunk) => {
        console.log("chunks recieves");
        res.write(chunk);
    });

    stream.on('end', () => {
        console.log("File reading finished");
        res.end();
    });

});

server.listen(4000, () => {
    console.log("Server running at port 4000");
});
