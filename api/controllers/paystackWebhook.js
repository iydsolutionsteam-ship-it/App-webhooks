import crypto from "crypto";
import PsrTestUser from "../models/PsrTestUser.js";
import EduTestUser from "../models/EduTestUser.js";

export const handlePaystackWebhook = async (req, res) => {
  try {
    // 1️⃣ Verify Paystack signature
    const paystackSignature = req.headers["x-paystack-signature"];
    const rawBody = JSON.stringify(req.body); // Use raw body string

    const hash = crypto
      .createHmac("sha512", process.env.PAYMENT_API_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== paystackSignature) {
      console.warn("⚠️ Invalid Paystack webhook signature!");
      return res.sendStatus(400);
    }

    // 2️⃣ Process the event
    const event = req.body;

    if (event.event !== "charge.success" && event.event !== "charge.failed") {
      return res.sendStatus(200);
    }

    const { reference, amount, status, metadata } = event.data;
    const { app: appName, userId } = metadata || {};

    if (!appName || !userId) return res.sendStatus(400);

    let UserModel;
    if (appName === "psrtest") UserModel = PsrTestUser;
    else if (appName === "edutest") UserModel = EduTestUser;
    else return res.sendStatus(400);

    const user = await UserModel.findById(userId);
    if (!user) return res.sendStatus(404);

    const payment = user.paymentHistory.find((p) => p.reference === reference);
    if (payment) {
      payment.status = status === "success" ? "success" : "failed";
    } else {
      user.paymentHistory.push({
        reference,
        amount: amount / 100,
        status: status === "success" ? "success" : "failed",
        date: new Date(),
      });
    }

    if (status === "success") user.isPaid = true;
    await user.save();

    console.log(`[Webhook] Verified & updated payment for ${appName}: ${reference}`);
    res.sendStatus(200);

  } catch (err) {
    console.error("Webhook DB update error:", err.message);
    res.sendStatus(500);
  }
};
