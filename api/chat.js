const A4F_API_KEY = process.env.A4F_API_KEY || "ddc-a4f-9d06c9a8b0ad4098959c676b16336dac";

// Import the same storage from admin.js
// Note: This is a workaround for serverless environments
// In a real application, you'd want to use a proper database
let issuedKeys = [];
let revokedKeys = [];

// This function will be called by the Telegram bot to sync keys
export function syncKeys(activeKeys, revokedKeysList) {
  issuedKeys = activeKeys;
  revokedKeys = revokedKeysList;
}

function isValidKey(key) {
  return issuedKeys.includes(key) && !revokedKeys.includes(key);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const userKey = req.headers["authorization"];
  if (!userKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const cleanKey = userKey.replace("Bearer ", "");
  if (!isValidKey(cleanKey)) {
    return res.status(403).json({ error: "Invalid or revoked API key" });
  }

  try {
    const response = await fetch("https://api.a4f.co/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${A4F_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ...req.body,
        model: "provider-6/gemini-2.5-flash"
      })
    });

    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
      }
