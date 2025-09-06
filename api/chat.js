// Simple in-memory storage (same as admin.js)
let issuedKeys = [];
let revokedKeys = [];

function isValidKey(key) {
  return issuedKeys.includes(key) && !revokedKeys.includes(key);
}

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  // Check for API key in headers
  const userKey = req.headers["authorization"];
  if (!userKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  // Extract and validate the key
  const cleanKey = userKey.replace("Bearer ", "");
  if (!isValidKey(cleanKey)) {
    return res.status(403).json({ error: "Invalid or revoked API key" });
  }

  try {
    // Forward the request to A4F API
    const A4F_API_KEY = process.env.A4F_API_KEY || "ddc-a4f-9d06c9a8b0ad4098959c676b16336dac";
    
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

    // Return the response from A4F API
    const data = await response.json();
    res.status(200).json(data);

  } catch (err) {
    // Handle errors
    res.status(500).json({ error: "Proxy failed", details: err.message });
  }
}
