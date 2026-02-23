import express from 'express';
import Confession from '../models/Confession.js';
import User from '../models/User.js';

const router = express.Router();

// POST /confessions — Create a new confession
router.post('/', async (req, res) => {
    try {
        const { text, secretCode, userId, category ,anonymousName} = req.body;

        if (!text || !secretCode || !userId) {
            return res.status(400).json({ error: 'Text, secret code, and userId are required.' });
        }

        if (secretCode.length < 4) {
            return res.status(400).json({ error: 'Secret code must be at least 4 characters.' });
        }

        const user = await User.findOne({ googleId: userId });
        const anonName = user?.anonymousName || 'Anonymous';

        const confession = new Confession({ text, secretCode, userId, category, anonymousName: anonName });
        await confession.save();

        // Return without secretCode
        const response = confession.toObject();
        delete response.secretCode;

        res.status(201).json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /confessions — Get all confessions
router.get('/', async (req, res) => {
    try {
        const confessions = await Confession
            .find({})
            .select('-secretCode')
            .sort({ createdAt: -1 });

        res.json(confessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /confessions/:id — Update confession (requires secret code)
router.put('/:id', async (req, res) => {
    try {
        const { secretCode, text } = req.body;

        if (!secretCode) {
            return res.status(400).json({ error: 'Secret code is required to edit.' });
        }

        if (!text) {
            return res.status(400).json({ error: 'Updated text is required.' });
        }

        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ error: 'Confession not found.' });
        }

        if (!confession.verifySecretCode(secretCode)) {
            return res.status(403).json({ error: 'Incorrect secret code.' });
        }

        confession.text = text;
        await confession.save();

        // Return without secretCode
        const response = confession.toObject();
        delete response.secretCode;
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /confessions/:id — Delete confession (requires secret code)
router.delete('/:id', async (req, res) => {
    try {
        const { secretCode } = req.body;

        if (!secretCode) {
            return res.status(400).json({ error: 'Secret code is required to delete.' });
        }

        const confession = await Confession.findById(req.params.id);

        if (!confession) {
            return res.status(404).json({ error: 'Confession not found.' });
        }

        if (!confession.verifySecretCode(secretCode)) {
            return res.status(403).json({ error: 'Incorrect secret code.' });
        }

        await Confession.findByIdAndDelete(req.params.id);
        res.json({ message: 'Confession deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /confessions/:id/react — Instagram/Facebook style reactions
router.post('/:id/react', async (req, res) => {
    try {
        const { type, userId } = req.body;
        const allowedTypes = ['like', 'heart', 'laugh', 'cry', 'dislike', 'unlike'];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid reaction type.' });
        }

        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ error: 'Not found.' });

        // 1. DATA RESET & SANITIZATION (The "Mop" step)
        if (!Array.isArray(confession.reactions) ||
            (confession.reactions.length > 0 && typeof confession.reactions[0].userId === 'undefined')) {
            confession.reactions = [];
            await confession.save();
        }

        // 2. FIND CURRENT USER'S REACTION
        const existingReaction = (confession.reactions || []).find(r => r.userId === userId);

        let finalConfession;
        if (type === 'unlike') {
            // Explicit UNLIKE
            finalConfession = await Confession.findByIdAndUpdate(
                req.params.id,
                { $pull: { reactions: { userId } } },
                { new: true }
            );
        } else if (existingReaction) {
            if (existingReaction.type === type) {
                // TOGGLE OFF: User clicked the SAME icon (Unlike)
                finalConfession = await Confession.findByIdAndUpdate(
                    req.params.id,
                    { $pull: { reactions: { userId } } },
                    { new: true }
                );
            } else {
                // SWITCH: User clicked a DIFFERENT icon (Like -> Heart)
                finalConfession = await Confession.findOneAndUpdate(
                    { _id: req.params.id, "reactions.userId": userId },
                    { $set: { "reactions.$.type": type } },
                    { new: true }
                );
            }
        } else {
            // NEW: User reacting for the first time
            finalConfession = await Confession.findByIdAndUpdate(
                req.params.id,
                { $push: { reactions: { userId, type } } },
                { new: true }
            );
        }

        res.json(finalConfession);
    } catch (err) {
        console.error('Reaction Error:', err);
        res.status(500).json({ error: 'Failed to process reaction.' });
    }
});

// POST /confessions/:id/save — Toggle Save
router.post('/:id/save', async (req, res) => {
    try {
        const { userId } = req.body;
        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ error: 'Not found.' });

        // Migration
        if (!Array.isArray(confession.savedBy)) {
            confession.savedBy = [];
            await confession.save();
        }

        const isSaved = confession.savedBy.includes(userId);
        const update = isSaved
            ? { $pull: { savedBy: userId } }
            : { $addToSet: { savedBy: userId } };

        const updated = await Confession.findByIdAndUpdate(req.params.id, update, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /confessions/:id/comments — Add a comment
router.post('/:id/comments', async (req, res) => {
    try {
        const { userId, userName, userImage, text } = req.body;
        // Migration
        const confession = await Confession.findById(req.params.id);
        if (confession && !Array.isArray(confession.comments)) {
            confession.comments = [];
            await confession.save();
        }

        const updated = await Confession.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { userId, userName, userImage, text } } },
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /confessions/:id/comments/:commentId — Edit a comment
router.put('/:id/comments/:commentId', async (req, res) => {
    try {
        const { text, userId } = req.body;
        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ error: 'Not found.' });

        const comment = confession.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });
        if (comment.userId !== userId) return res.status(403).json({ error: 'Unauthorized.' });

        comment.text = text;
        comment.updatedAt = Date.now();
        await confession.save();
        res.json(confession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /confessions/:id/comments/:commentId — Delete a comment
router.delete('/:id/comments/:commentId', async (req, res) => {
    try {
        const { userId } = req.body;
        const confession = await Confession.findById(req.params.id);
        if (!confession) return res.status(404).json({ error: 'Not found.' });

        const comment = confession.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found.' });
        if (comment.userId !== userId) return res.status(403).json({ error: 'Unauthorized.' });

        confession.comments.pull(req.params.commentId);
        await confession.save();
        res.json(confession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
