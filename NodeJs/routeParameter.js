import express from 'express'

const app = express();

app.get('/users/:id', (req,res)=> {
    console.log(req.params);
    res.send('User Id is received');
    
})

app.listen(3000, ()=> {
    console.log("Server running at port 3000");
})