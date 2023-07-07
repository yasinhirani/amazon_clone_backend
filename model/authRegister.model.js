const mongoose = require("mongoose");

const orders = {
  title: String,
  image: String,
  quantity: Number,
  price: Number,
  orderId: String,
  orderedOn: String,
};

const authRegisterSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, "Name is required"],
    unique: true,
  },
  userEmail: {
    type: String,
    required: [true, "Quantity is required"],
  },
  password: {
    type: String,
    required: [true, "Total is required"],
  },
  role: {
    type: String,
    required: [true, "Role is required"],
  },
  orders: [orders],
});

module.exports = mongoose.model("users", authRegisterSchema);
