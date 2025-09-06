import crypto from "crypto";

// Simple in-memory storage
let issuedKeys = [];
let revokedKeys = [];

// Generate random key
function generateKey() {
  const random = crypto.randomBytes(32).toString("hex");
  return `mpx-7-ai-${random}`;
}

export default async function handler(req, res) {
  const authHeader = req.headers["authorization"];
  const ADMIN_SECRET = process.env.ADMIN_SECRET || "super-secret-admin";
  
  // Check admin authentication
  if (!authHeader || authHeader.replace("Bearer ", "") !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized admin" });
  }

  // Handle different HTTP methods
  if (req.method === "POST") {
    // Generate new key
    const newKey = generateKey();
    issuedKeys.push(newKey);
    
    // Remove from revoked if it was there before
    revokedKeys = revokedKeys.filter(k => k !== newKey);
    
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
    // List all keys
    return res.status(200).json({
      active: issuedKeys.filter(k => !revokedKeys.includes(k)),
      revoked: revokedKeys
    });
  }

  if (req.method === "DELETE") {
    const { key } = req.query;
    if (!key) return res.status(400).json({ error: "Missing key to revoke" });

    if (!issuedKeys.includes(key)) {
      return res.status(404).json({ error: "Key not found" });
    }

    if (!revokedKeys.includes(key)) {
      revokedKeys.push(key);
    }

    return res.status(200).json({ success: true, revoked: key });
  }

  // Method not allowed
  return res.status(405).json({ error: "Method not allowed" });
}
