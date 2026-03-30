import express from "express";
import { userAuth } from "../middleware/auth.js";
import razorpayInstance from "../utils/razorpay.js";
import Payment from "../model/payment.js";
import User from "../model/user.js";
import crypto from "crypto";

const paymentRouter = express.Router();

// Route to Create a Razorpay Order
paymentRouter.post("/create", userAuth, async (req, res) => {
  try {
    const { amount, currency } = req.body; // amount in smallest unit (e.g., paise for INR)

    const options = {
      amount: amount * 100, // razorpay expects amount in paise
      currency: currency || "INR",
      receipt: `receipt_${req.user._id}_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    // Save initial payment entry in DB
    const newPayment = new Payment({
      userId: req.user._id,
      orderId: order.id,
      amount: amount,
      currency: options.currency,
      status: "pending",
    });

    await newPayment.save();

    res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route to Verify Razorpay Signature
paymentRouter.post("/verify", userAuth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment Successful
      const paymentRecord = await Payment.findOne({ orderId: razorpay_order_id });
      if (!paymentRecord) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      paymentRecord.status = "completed";
      paymentRecord.paymentId = razorpay_payment_id;
      paymentRecord.signature = razorpay_signature;
      await paymentRecord.save();

      // Update User Membership (Example: set to silver)
      await User.findByIdAndUpdate(req.user._id, { membershipType: "silver" });

      return res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default paymentRouter;
