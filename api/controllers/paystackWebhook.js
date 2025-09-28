import crypto from "crypto";

export const handlePaystackWebhook = async (req, res) => {
  const requestId = req.id || "no-request-id"; // express-request-id gives you this
  console.info(`[Webhook][${requestId}] Incoming request at ${new Date().toISOString()}`);

  try {
    // 1️⃣ Verify Paystack signature
    const paystackSignature = req.headers["x-paystack-signature"];
    const rawBody = req.rawBody || JSON.stringify(req.body);

    if (!paystackSignature) {
      console.warn(`[Webhook][${requestId}] Missing Paystack signature header`);
      return res.sendStatus(400);
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYMENT_API_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (hash !== paystackSignature) {
      console.warn(`[Webhook][${requestId}] Invalid Paystack webhook signature`);
      return res.sendStatus(400);
    }

    console.info(`[Webhook][${requestId}] Signature verified successfully`);

    // 2️⃣ Process the event
    const event = req.body;
    console.debug(`[Webhook][${requestId}] Event received: ${event.event}`);

    if (event.event !== "charge.success" && event.event !== "charge.failed") {
      console.info(`[Webhook][${requestId}] Ignored event: ${event.event}`);
      return res.sendStatus(200);
    }

    const { reference, amount, status, metadata } = event.data;
    const { app: appName, userId } = metadata || {};

    if (!appName || !userId) {
      console.error(`[Webhook][${requestId}] Missing metadata: app=${appName}, userId=${userId}`);
      return res.sendStatus(400);
    }

    console.info(
      `[Webhook][${requestId}] Processing ${status} payment | App=${appName}, User=${userId}, Ref=${reference}, Amount=${amount / 100}`
    );

    // 3️⃣ Pick the correct model
    let UserModel;
    if (appName === "psrtest") UserModel = req.PsrTestUser;
    else if (appName === "edutest") UserModel = req.EduTestUser;
    else {
      console.error(`[Webhook][${requestId}] Unknown app name: ${appName}`);
      return res.sendStatus(400);
    }

    // 4️⃣ Update user payment info
    const user = await UserModel.findById(userId);
    if (!user) {
      console.error(`[Webhook][${requestId}] User not found: ${userId}`);
      return res.sendStatus(404);
    }

    let payment = user.paymentHistory.find((p) => p.reference === reference);
    if (payment) {
      console.debug(`[Webhook][${requestId}] Updating existing payment: ${reference}`);
      payment.status = status === "success" ? "success" : "failed";
    } else {
      console.debug(`[Webhook][${requestId}] Adding new payment: ${reference}`);
      user.paymentHistory.push({
        reference,
        amount: amount / 100,
        status: status === "success" ? "success" : "failed",
        date: new Date(),
      });
    }

    if (status === "success") {
      user.isPaid = true;
      console.info(`[Webhook][${requestId}] Marked user as paid: ${userId}`);
    }

    await user.save();
    console.info(`[Webhook][${requestId}] Payment update complete for ${appName}: ${reference}`);
    res.sendStatus(200);
  } catch (err) {
    console.error(`[Webhook][${requestId}] DB update error: ${err.message}`, err);
    res.sendStatus(500);
  }
};