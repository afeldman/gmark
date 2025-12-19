import { crypto } from "std/crypto/mod.ts";

// Verwende Web Crypto API für SHA256 Hashing mit Salt
export async function hashPassword(password: string): Promise<string> {
  // Begrenze auf 72 Zeichen (bcrypt limit)
  const truncated = password.substring(0, 72);

  // Generiere Random Salt (16 Bytes = 128 Bits)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Kombiniere Password + Salt
  const encoder = new TextEncoder();
  const data = encoder.encode(truncated + saltHex);

  // SHA256 Hash
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Format: sha256$<salt>$<hash>
  return `sha256$${saltHex}$${hashHex}`;
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    // Format check: sha256$<salt>$<hash>
    if (!hash.startsWith("sha256$")) {
      return false;
    }

    const parts = hash.split("$");
    if (parts.length !== 3) {
      return false;
    }

    const [, saltHex, storedHash] = parts;

    // Begrenze auf 72 Zeichen
    const truncated = password.substring(0, 72);

    // Berechne Hash mit gespeichertem Salt
    const encoder = new TextEncoder();
    const data = encoder.encode(truncated + saltHex);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const computedHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Vergleiche mit Timing Attack Schutz
    return constantTimeCompare(computedHash, storedHash);
  } catch {
    return false;
  }
}

// Timing-Attack sichere Vergleich Funktion
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}
