/**
 * UsageManager - Verfolgt und begrenzt KI-Tokenverbrauch pro Tag
 * Speichert Werte in StorageManager.settings
 */
import StorageManager from "./storage.js";

const DEFAULT_DAILY_LIMIT = 10000; // ungefähr, abhängig vom Modell
const ESTIMATE_CHARS_PER_TOKEN = 4; // grobe Schätzung

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
}

export class UsageManager {
  static async ensureDailyReset() {
    const lastReset =
      (await StorageManager.getSetting("tokensLastReset")) || null;
    const today = todayKey();
    if (lastReset !== today) {
      await StorageManager.setSetting("dailyTokensUsed", 0);
      await StorageManager.setSetting("tokensLastReset", today);
      console.log("🔄 Tokenzähler zurückgesetzt für", today);
    }
  }

  static async getDailyLimit() {
    const limit = await StorageManager.getSetting("dailyTokenLimit");
    return typeof limit === "number" && limit > 0 ? limit : DEFAULT_DAILY_LIMIT;
  }

  static async getUsedToday() {
    await this.ensureDailyReset();
    const used = await StorageManager.getSetting("dailyTokensUsed");
    return typeof used === "number" ? used : 0;
  }

  static estimateTokensFromText(text) {
    if (!text) return 0;
    return Math.ceil(text.length / ESTIMATE_CHARS_PER_TOKEN);
  }

  static async canConsume(requiredTokens) {
    await this.ensureDailyReset();
    const limit = await this.getDailyLimit();
    const used = await this.getUsedToday();
    const can = used + requiredTokens <= limit;
    console.log("📊 Tokens:", { used, required: requiredTokens, limit, can });
    return can;
  }

  static async consume(tokens) {
    await this.ensureDailyReset();
    const used = await this.getUsedToday();
    const next = used + tokens;
    await StorageManager.setSetting("dailyTokensUsed", next);
    console.log("➕ Tokens verbraucht:", tokens, "→ heute gesamt:", next);
    return next;
  }
}

export default UsageManager;
