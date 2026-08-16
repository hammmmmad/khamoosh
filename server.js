const express = require("express");
const webPush = require("web-push");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL;

if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_EMAIL) {
  console.error("Missing VAPID environment variables.");
  process.exit(1);
}

webPush.setVapidDetails(
  VAPID_EMAIL,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// دریافت subscription
app.post("/subscribe", (req, res) => {
  const subscription = req.body;

  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({
      error: "Invalid subscription"
    });
  }

  console.log("New push subscription:", subscription);

  res.status(201).json({
    success: true,
    message: "Subscription saved"
  });
});

// ارسال Push Notification
app.post("/send-notification", async (req, res) => {
  try {
    const { subscription, title, body } = req.body;

    if (!subscription) {
      return res.status(400).json({
        error: "Subscription is required"
      });
    }

    const payload = JSON.stringify({
      title: title || "Khamoosh",
      body: body || "New notification"
    });

    await webPush.sendNotification(subscription, payload);

    res.json({
      success: true
    });

  } catch (error) {
    console.error("Push notification error:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get("/api/vapid-public-key", (req, res) => {
  res.json({
    publicKey: VAPID_PUBLIC_KEY
  });
});

app.get("/", (req, res) => {
  res.send("Khamoosh server is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});