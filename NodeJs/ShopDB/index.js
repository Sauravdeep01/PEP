import express from "express";
import mongoose from "mongoose";

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("DB Connected"));

const productSchema = new mongoose.Schema({
  name: String,
  price: Number
});

const Product = mongoose.model("Product", productSchema);

app.get("/products", async (req, res) => {

  const page = parseInt(req.query.page) || 1;
  const limit = 2;

  const skip = limit * (page - 1);

  const products = await Product.find({}, { name: 1, _id: 0 })
    .sort({ price: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    page,
    data: products
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running at port ${process.env.PORT}`);
});