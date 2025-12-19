import { getDB } from "../utils/db.ts";
import { hashPassword, verifyPassword } from "../utils/password.ts";
import { generateToken, getTokenExpiration } from "../utils/jwt.ts";

export async function registerUser(
  username: string,
  email: string,
  password: string,
) {
  const db = getDB();

  // Prüfe ob User existiert
  if (db.getUserByUsername(username)) {
    throw new Error("User already exists");
  }

  // Hash Password
  const hashedPassword = await hashPassword(password);

  // Erstelle User
  const userId = db.createUser(username, email, hashedPassword);

  return { id: userId, username, email };
}

export async function loginUser(username: string, password: string) {
  const db = getDB();

  // Finde User
  const user = db.getUserByUsername(username);
  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Verifiziere Password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  // Generiere Token
  const token = await generateToken(user.id);
  const expiresAt = getTokenExpiration();

  // Speichere Session
  db.createSession(user.id, token, expiresAt.toISOString());

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
    expiresAt,
  };
}

export async function getUser(userId: number) {
  const db = getDB();
  const user = db.getUserById(userId);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.created_at,
  };
}

export async function validateToken(token: string) {
  const db = getDB();
  const session = db.getSessionByToken(token);

  if (!session) {
    return null;
  }

  const expireDate = new Date(session.expires_at);

  // Prüfe Expiration
  if (expireDate < new Date()) {
    // Lösche abgelaufene Session
    db.deleteSession(token);
    return null;
  }

  // Hole User Daten
  const user = db.getUserById(session.user_id);
  if (!user) {
    return null;
  }

  return { id: user.id, username: user.username, email: user.email };
}
