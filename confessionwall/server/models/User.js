import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true }, // Optional for manual users
    customUserId: { type: String, unique: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    anonymousName: { type: String, default: '' },
    picture: { type: String, default: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
