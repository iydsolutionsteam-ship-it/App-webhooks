import mongoose from "mongoose";

const psrTestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      lowercase: true,
    },
    isPaid: { type: Boolean, default: false },
    paymentHistory: [
      {
        reference: String,
        amount: Number,
        status: { type: String, enum: ["pending", "failed", "success"] },
        date: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default psrTestSchema; // export schema only
