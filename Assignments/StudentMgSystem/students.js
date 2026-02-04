const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

const FILE = "students.json";

function getStudents() {
    return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

function saveStudents(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}


app.post("/students", (req, res) => {
    let students = getStudents();
    students.push(req.body);
    saveStudents(students);
    res.send("Student Added");
});


app.get("/students", (req, res) => {
    res.json(getStudents());
});


app.get("/students/:id", (req, res) => {
    let students = getStudents();
    let student = students.find(s => s.id == req.params.id);
    res.json(student || "Student not found");
});



app.put("/students/:id", (req, res) => {
    let students = getStudents();

    for (let i = 0; i < students.length; i++) {
        if (students[i].id == req.params.id) {
            students[i] = req.body;
        }
    }

    saveStudents(students);
    res.send("Student Updated");
});



app.delete("/students/:id", (req, res) => {
    let students = getStudents();
    students = students.filter(s => s.id != req.params.id);
    saveStudents(students);
    res.send("Student Deleted");
});



app.listen(3000, () => {
    console.log("Server running on port 3000");
});
