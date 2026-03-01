import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import confessionRoutes from './routes/confessions.js';
import userRoutes from './routes/users.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/confessions', confessionRoutes);
app.use('/users', userRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// API Health check (optional, but good to keep under an /api prefix or similar if needed)
app.get('/health', (req, res) => {
    res.json({ message: 'Confession Wall API is running' });
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log('✅ Connected to MongoDB');

        try {
            const usersCollection = mongoose.connection.db.collection('users');
            const indexes = await usersCollection.indexes();
            console.log('🔍 Current database indexes:', indexes.map(i => i.name));

            for (const index of indexes) {
                // Drop any index that isn't _id_ or part of our new schema
                if (index.name.includes('clerk') || index.name.includes('googleId') && index.name !== 'googleId_1') {
                    console.log(`🧹 Dropping legacy index: ${index.name}`);
                    await usersCollection.dropIndex(index.name);
                }
            }
        } catch (err) {
            console.log('ℹ️ Index cleanup info:', err.message);
        }

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err.message);
    });
