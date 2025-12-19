// Tests für AI Service
import { assertEquals } from "std/assert";
import * as AiService from "../src/services/ai.ts";

Deno.test("AI Service - Classify by Patterns", () => {
  const result = AiService.classifyByPatterns(
    "GitHub Repository",
    "A modern runtime for JavaScript and TypeScript",
    ["github", "code", "javascript"],
  );

  assertEquals(result.category, "Development");
});

Deno.test("AI Service - Classify Social Media", () => {
  const result = AiService.classifyByPatterns("Twitter", "What's happening", [
    "twitter",
    "social",
  ]);

  assertEquals(result.category, "Social");
});

Deno.test("AI Service - Classify News", () => {
  const result = AiService.classifyByPatterns(
    "Breaking News",
    "Latest updates on technology",
    ["news", "article"],
  );

  assertEquals(result.category, "News");
});

Deno.test("AI Service - Classify Shopping", () => {
  const result = AiService.classifyByPatterns(
    "Amazon Store",
    "Buy products online",
    ["amazon", "shop", "buy"],
  );

  assertEquals(result.category, "Shopping");
});

Deno.test("AI Service - Default Other Category", () => {
  const result = AiService.classifyByPatterns(
    "Random Title",
    "Random content",
    ["random"],
  );

  assertEquals(result.category, "Other");
});

Deno.test("AI Service - Generate Tags", () => {
  const tags = AiService.generateTags(
    "GitHub Repository",
    "A repository on GitHub",
    ["github", "code"],
    "Development",
  );

  assertEquals(tags.includes("Development"), true);
  assertEquals(tags.includes("github"), true);
  assertEquals(tags.includes("code"), true);
});

Deno.test("AI Service - Generate Tags Max 10", () => {
  const keywords = Array.from({ length: 20 }, (_, i) => `keyword${i}`);
  const tags = AiService.generateTags(
    "Test Title",
    "Description",
    keywords,
    "Development",
  );

  assertEquals(tags.length <= 10, true);
});

Deno.test("AI Service - Classify Bookmark Pipeline", async () => {
  const result = await AiService.classifyBookmark(
    "GitHub Deno",
    "Modern runtime for TypeScript",
    ["github", "typescript", "runtime"],
    { useOpenAI: false, useLocalLLM: false, usePatterns: true },
  );

  assertEquals(result.category, "Development");
  assertEquals(result.tags.length > 0, true);
  assertEquals(result.method, "patterns");
});
