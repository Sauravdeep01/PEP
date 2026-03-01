import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const router = express.Router();

// GET /users/:id — Get user's anonymous settings
router.get('/:id', async (req, res) => {
    try {
        let user = await User.findOne({
            $or: [{ googleId: req.params.id }, { customUserId: req.params.id }]
        });
        if (!user) {
            return res.json({ id: req.params.id, anonymousName: '' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /users/sync — Sync user data from Google OAuth to MongoDB
router.post('/sync', async (req, res) => {
    try {
        const { googleId, email, username } = req.body;
        if (!googleId) return res.status(400).json({ error: 'googleId is required' });

        const randomID = Math.floor(1000 + Math.random() * 9000);

        // Use findOneAndUpdate with upsert to avoid race conditions
        const user = await User.findOneAndUpdate(
            { googleId },
            {
                $setOnInsert: {
                    googleId,
                    customUserId: `USER_${randomID}`,
                    anonymousName: `User_${randomID}`
                },
                $set: {
                    email: email || '',
                    username: username || ''
                }
            },
            { upsert: true, new: true, runValidators: true }
        );

        res.json(user);
    } catch (err) {
        console.error('Sync error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /users/update — Update user's anonymous name
router.post('/update', async (req, res) => {
    try {
        const { id, googleId, anonymousName } = req.body;
        const userId = id || googleId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required.' });
        }

        let user = await User.findOneAndUpdate(
            { $or: [{ googleId: userId }, { customUserId: userId }] },
            { anonymousName: anonymousName || '' },
            { new: true }
        );
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /users/manual-auth — Manual Login/Signup with password
router.post('/manual-auth', async (req, res) => {
    try {
        const { email, username, password, action } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        if (action === 'signup') {
            // --- SIGN UP ---
            if (!email || !username) {
                return res.status(400).json({ error: 'Email, username and password are required' });
            }

            const existingByEmail = await User.findOne({ email });
            if (existingByEmail) {
                return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
            }

            const existingByUsername = await User.findOne({ username });
            if (existingByUsername) {
                return res.status(400).json({ error: 'Username already taken. Please choose another.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const randomID = Math.floor(1000 + Math.random() * 9000);

            const user = new User({
                email,
                username,
                password: hashedPassword,
                customUserId: `USER_${randomID}`,
                anonymousName: `User_${randomID}`
            });
            await user.save();

            res.json(user);

        } else {
            // --- LOGIN ---
            // Accept email OR username as identifier
            const identifier = email || username;
            if (!identifier) {
                return res.status(400).json({ error: 'Email/Username and password are required' });
            }

            const user = await User.findOne({
                $or: [{ email: identifier }, { username: identifier }]
            });

            if (!user) {
                return res.status(400).json({ error: 'No account found. Please sign up first.' });
            }

            if (!user.password) {
                return res.status(400).json({ error: 'This account uses Google Sign-In. Please use Google to log in.' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect password. Please try again.' });
            }

            res.json(user);
        }

    } catch (err) {
        console.error('Manual auth error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
