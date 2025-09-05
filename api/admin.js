import crypto from "crypto";

const ADMIN_SECRET = process.env.ADMIN_SECRET || "super-secret-admin"; // Admin secret
global.issuedKeys = global.issuedKeys || [];
global.revokedKeys = global.revokedKeys || [];

// Generate random key
function generateKey() {
  const random = crypto.randomBytes(32).toString("hex"); // long key
  return `mpx-7-ai-${random}`;
}

export default async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader.replace("Bearer ", "") !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized admin" });
  }

  if (req.method === "POST") {
    // Generate new key
    const newKey = generateKey();
    global.issuedKeys.push(newKey);
    return res.status(201).json({
      success: true,
      api_key: newKey,
      api_url: "https://mpx-free-api.vercel.app/api/chat",
      example_curl: `curl -X POST https://mpx-free-api.vercel.app/api/chat \\
  -H "Authorization: Bearer ${newKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"message":"Hello"}'`
    });
  }

  if (req.method === "GET") {
    // List keys
    return res.status(200).json({
      active: global.issuedKeys.filter(k => !global.revokedKeys.includes(k)),
      revoked: global.revokedKeys
    });
  }

  if (req.method === "DELETE") {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key to revoke" });

    if (!global.issuedKeys.includes(key)) {
      return res.status(404).json({ error: "Key not found" });
    }

    if (!global.revokedKeys.includes(key)) {
      global.revokedKeys.push(key);
    }

    return res.status(200).json({ success: true, revoked: key });
  }

  return res.status(405).json({ error: "Method not allowed" });
}