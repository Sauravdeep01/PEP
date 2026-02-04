// import express from 'express'

// const app = express();

// app.get('/users/:id', (req,res)=> {
//     console.log(req.params);
//     res.send('User Id is received');
    
// })

// app.listen(3000, ()=> {
//     console.log("Server running at port 3000");
// })






import express from 'express';

const app = express();

const students = [
    { id: 1, name: "Ravi" },
    { id: 2, name: "Saurav" },
    { id: 3, name: "Vikas" }
];

app.get('/students/:id', (req, res) => {
    const id = Number(req.params.id);

    const student = students.find(s => s.id === id);

    if (!student) {
        return res.status(404).send("Student not found");
    }

    res.json(student);
});

app.listen(3000, () => {
    console.log("Server running at port 3000");
});
