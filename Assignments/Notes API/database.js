import mongoose from 'mongoose';

const connectDB = () => {
  mongoose.connect("mongodb+srv://saurav_01:0003%40Saurav@mycluster.tp8ebka.mongodb.net/Notes")
    .then(() => console.log("MongoDB connected"))
    .catch((error) => console.log(error));
};

export default connectDB;
