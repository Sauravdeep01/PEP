const express = require('express');

const app = express();


const asyncWork = () => {
    Promise.reject(new Error("Async Error"));
}

app.get('/test', async(req,res)=> {
    asyncWork().catch(next);
    res.send("Success")
})

// app.get('/crash', (req,res)=> {
//     throw new Error("code crashed");
    
// })

app.use((err, req, res, next)=> {
    console.log("Error caught");
    console.log(err.message);

    res.status(500).send("Something went wrong");
    
})

app.listen(3000, ()=> {
    console.log("Server running at port 3000");
    
})