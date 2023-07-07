require("dotenv").config();
const express = require("express");
const cors = require("cors");
const stripe = require("stripe").default(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Auth = require("./model/authRegister.model");

const app = express();
const port = 8080 || process.env.PORT;

app.use(cors());
app.use(express.json());

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_CONNECT_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

app.post("/api/create-checkout-session", async (req, res) => {
  const { products, email } = req.body;
  // create a new Checkout Session for the order
  const transformedItems = products.map((product) => {
    return {
      quantity: product.quantity,
      price_data: {
        currency: "inr",
        unit_amount: product.price * 100,
        product_data: {
          name: product.title,
          images: [product.image],
        },
      },
    };
  });
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    shipping_address_collection: {
      allowed_countries: ["US", "CA", "IN"],
    },
    line_items: transformedItems,
    mode: "payment",
    success_url: `https://yasin-amazon-clone.vercel.app/success`,
    cancel_url: `https://yasin-amazon-clone.vercel.app/failed`,
    metadata: {
      email,
      images: JSON.stringify(products.map((product) => product.image)),
    },
  });

  res.send({ success: true, id: session.id });
});

app.post("/api/register", async (req, res) => {
  connectDB();
  const { userName, userEmail, password } = req.body;
  const hashPassword = await bcrypt.hash(password, 10).then((hash) => hash);
  const registerAuth = new Auth({
    userName,
    userEmail,
    password: hashPassword,
    role: "user",
    orders: [],
  });
  registerAuth
    .save()
    .then(() => {
      res.status(201).send({
        success: true,
        message: "Registered successfully, please login to continue",
      });
    })
    .catch((err) => {
      if (err.code === 11000) {
        res.send({ success: false, message: "Email address already exists" });
      } else {
        res.send({
          success: false,
          message:
            "There was a issue while registering you, please try after some time",
        });
      }
    });
});

app.post("/api/login", async (req, res) => {
  connectDB();
  const user = Auth;
  const isAvailable = await user.findOne({ userEmail: req.body.userEmail });
  if (isAvailable) {
    const match = await bcrypt.compare(req.body.password, isAvailable.password);
    if (match) {
      res.status(200).send({
        success: true,
        message: "Login successful",
        authData: {
          userEmail: isAvailable.userEmail,
          userName: isAvailable.userName,
          role: isAvailable.role,
          // access_token: generateAccessToken(
          //   req.body.userEmail,
          //   isAvailable.role
          // ),
        },
      });
    } else {
      res.status(200).send({ success: false, message: "Invalid Credentials" });
    }
  } else {
    res.status(200).send({ success: false, message: "User not found" });
  }
});

app.post("/api/addOrders", async (req, res) => {
  connectDB();
  const user = Auth;
  await user
    .updateOne(
      { userEmail: req.body.userEmail },
      {
        $push: { orders: req.body.items },
      }
    )
    .then(() => {
      res.send({ success: true, message: "" });
    })
    .catch(() => {
      res.send({ success: false, message: "Something went wrong" });
    });
});

app.post("/api/getUserOrders", async (req, res) => {
  connectDB();
  const user = Auth;
  const userData = await user.findOne({ userEmail: req.body.userEmail });
  if (userData) {
    res.send({
      success: true,
      message: "",
      orders: userData.orders,
    });
  } else {
    res.send({
      success: false,
      message: "Something went wrong, please try after sometime",
      orders: [],
    });
  }
});

app.listen(port, () => {
  console.log("server started");
});
