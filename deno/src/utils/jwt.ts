// Einfache JWT Implementierung ohne externe Dependencies
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const secret = Deno.env.get("SECRET_KEY") || "gmark-secret-key-2025-production-secure-token";
const algorithm = "HS256";
const expirationMinutes = parseInt(Deno.env.get("ACCESS_TOKEN_EXPIRE_MINUTES") || "30");

// Base64URL Encoding
function base64UrlEncode(data: string): string {
  return btoa(data)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Base64URL Decoding
function base64UrlDecode(data: string): string {
  const padding = (4 - (data.length % 4)) % 4;
  data = data + "=".repeat(padding);
  return atob(data.replace(/-/g, "+").replace(/_/g, "/"));
}

// HMAC-SHA256 Signing
async function sign(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

// Verify HMAC-SHA256 Signature
async function verify(message: string, signature: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signatureBytes = new Uint8Array(
    base64UrlDecode(signature).split("").map((c) => c.charCodeAt(0))
  );

  return await crypto.subtle.verify("HMAC", key, signatureBytes, messageData);
}

export async function generateToken(userId: number): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + expirationMinutes * 60;

  const header = base64UrlEncode(JSON.stringify({ alg: algorithm, typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({ userId, iat: now, exp: expiresAt })
  );

  const message = `${header}.${payload}`;
  const signature = await sign(message);

  return `${message}.${signature}`;
}

export async function verifyToken(token: string): Promise<{ userId: number } | null> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    if (!headerB64 || !payloadB64 || !signatureB64) {
      return null;
    }

    const message = `${headerB64}.${payloadB64}`;
    const isValid = await verify(message, signatureB64);

    if (!isValid) {
      return null;
    }

    const payloadStr = base64UrlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Prüfe Expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export function getTokenExpiration(): Date {
  return new Date(Date.now() + expirationMinutes * 60 * 1000);
}
