import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      date: { type: Date, default: Date.now }
    }
  ],
  },
  { timestamps: true }
);

const PsrTestUser = mongoose.model("PSRtest_User", psrTestSchema);
export default PsrTestUser;





