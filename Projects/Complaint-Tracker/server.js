import express from 'express';
const app = express();

app.use(express.json());
app.use(express.static('Public'));

// Request Logger
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});


let complaints = [];
let nextId = 1;


app.get('/complaints', (req, res) => {
    res.json(complaints);
});

app.get('/complaints/:id', (req, res) => {
    const id = req.params.id;
    const complaint = complaints.find(c => c.id === id);

    if (!complaint) {
        return res.status(404).json({ message: "Complaint not found" });
    }
    res.json(complaint);
});


app.post('/complaints', (req, res) => {
    const { name, email, subject, description } = req.body;

    if (!name || !email || !subject || !description) {
        return res.status(400).json({ message: 'All fields (Name, Email, Subject, Description) are required' });
    }

    const complaintId = `CMP${String(nextId++).padStart(3, '0')}`;
    const complaint = {
        id: complaintId,
        name,
        email,
        subject,
        description,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    complaints.push(complaint);
    res.status(201).json(complaint);
});

// UPDATE a complaint status (Admin Use)
app.put('/complaints/:id', (req, res) => {
    const complaint = complaints.find(c => c.id === req.params.id);
    const { status } = req.body;

    if (!complaint) {
        return res.status(404).json({ message: 'Complaint not found' });
    }

    if (status) {
        complaint.status = status;
    } else {
        // Toggle or default
        complaint.status = complaint.status === 'pending' ? 'resolved' : 'pending';
    }

    res.json(complaint);
});


app.delete('/complaints/:id', (req, res) => {

    const index = complaints.findIndex(c => c.id === req.params.id);

    if (index === -1) {
        return res.status(404).json({ message: 'Complaint not found' });
    }
    complaints.splice(index, 1);
    res.json({ message: 'Complaint deleted successfully' });

})



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
});

export default app;



