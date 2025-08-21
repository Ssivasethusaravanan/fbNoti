// var instance = new Razorpay({ key_id: 'rzp_test_MayUuFrlK5IpNz', key_secret: 'zb8TcRGx8bMldtXbh9xvLWWo' })

 
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: 'rzp_test_MayUuFrlK5IpNz', // Store in .env
  key_secret: 'zb8TcRGx8bMldtXbh9xvLWWo', // Store in .env
});

// API Route to Create an Order
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount, // Amount in paise (₹500 = 50000 paise)
      currency: "INR",
      receipt: req.body.receipt || "receipt#1",
      partial_payment: false,
      notes: req.body.notes || {},
    };

    const order = await razorpay.orders.create(options);
    res.status(201).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating Razorpay order",
      error: error.message,
    });
  }
});

// Server Start
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
