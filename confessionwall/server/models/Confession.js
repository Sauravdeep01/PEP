import mongoose from 'mongoose';
import crypto from 'crypto';

const confessionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Confession text is required'],
    trim: true,
    maxlength: [1000, 'Confession cannot exceed 1000 characters']
  },
  secretCode: {
    type: String,
    required: [true, 'Secret code is required']
  },
  reactions: [
    {
      userId: { type: String, required: true },
      type: { type: String, enum: ['like', 'love', 'laugh'], required: true }
    }
  ],
  savedBy: [{ type: String }],
  comments: [
    {
      userId: { type: String, required: true },
      userName: { type: String },
      userImage: { type: String },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  userId: {
    type: String,
    required: true
  },
  anonymousName: {
    type: String,
    default: 'Anonymous'
  },
  category: {
    type: String,
    default: 'General'
  }
}, {
  timestamps: true
});

// Hash the secret code before saving
confessionSchema.pre('save', function (next) {
  if (this.isModified('secretCode')) {
    this.secretCode = crypto
      .createHash('sha256')
      .update(this.secretCode)
      .digest('hex');
  }
  next();
});

// Method to verify secret code
confessionSchema.methods.verifySecretCode = function (code) {
  const hashed = crypto
    .createHash('sha256')
    .update(code)
    .digest('hex');
  return this.secretCode === hashed;
};

const Confession = mongoose.model('Confession', confessionSchema);

export default Confession;
