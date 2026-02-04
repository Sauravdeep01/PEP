import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.get('/send', (rq,res)=> {
    res.send("Hello from express");
    
})

app.get('/json', (req,res)=> {
    res.json({
        name: "saurav",
        role: "developer"
    })
})

app.get('/status', (req,res)=> {
    res.status(404).send("Page not found");
})

app.get('/redirect', (req,res)=> {
    res.redirect('/send');
})


app.get('/write', (req,res)=> {
    res.write("Hello")
    res.write("vikas")
    res.write("How are you?")
    req.end("Bye");
})

app.get('/file', (req,res)=> {
    res.sendFile(__dirname + "/hello.html");
})

app.get('/end', (req,res)=> {
    res.end("Response finished")
})

app.listen(3000, ()=> {
    console.log("Server running at port 3000");
    
})