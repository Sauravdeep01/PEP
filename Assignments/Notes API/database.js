import mongoose from 'mongoose';

const connectDB = () => {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log(error));
};

export default connectDB;
