// Tests für HTML Service
import { assertEquals } from "std/assert";
import * as HtmlService from "../src/services/html.ts";

Deno.test("HTML Service - Extract Title from HTML", () => {
  const html = `
    <html>
      <head>
        <title>Test Page Title</title>
      </head>
    </html>
  `;

  const title = HtmlService.extractTitle(html);
  assertEquals(title, "Test Page Title");
});

Deno.test("HTML Service - Extract Title with OG Meta", () => {
  const html = `
    <head>
      <meta property="og:title" content="OG Title">
      <title>Regular Title</title>
    </head>
  `;

  const title = HtmlService.extractTitle(html);
  assertEquals(title, "OG Title");
});

Deno.test("HTML Service - Extract Title Fallback to H1", () => {
  const html = `
    <html>
      <body>
        <h1>H1 Title</h1>
      </body>
    </html>
  `;

  const title = HtmlService.extractTitle(html);
  assertEquals(title, "H1 Title");
});

Deno.test("HTML Service - Extract Description", () => {
  const html = `
    <head>
      <meta name="description" content="This is a test description">
    </head>
  `;

  const desc = HtmlService.extractDescription(html);
  assertEquals(desc, "This is a test description");
});

Deno.test("HTML Service - Extract Description OG Fallback", () => {
  const html = `
    <head>
      <meta property="og:description" content="OG Description">
    </head>
  `;

  const desc = HtmlService.extractDescription(html);
  assertEquals(desc, "OG Description");
});

Deno.test("HTML Service - Extract Keywords", () => {
  const html = `
    <head>
      <meta name="keywords" content="test,keywords,example">
    </head>
  `;

  const keywords = HtmlService.extractKeywords(html);
  assertEquals(keywords.length, 3);
  assertEquals(keywords[0], "test");
});

Deno.test("HTML Service - Extract Keywords Empty", () => {
  const html = `<html><head></head></html>`;
  const keywords = HtmlService.extractKeywords(html);
  assertEquals(keywords.length, 0);
});

Deno.test("HTML Service - Decode HTML Entities", () => {
  const encoded = "Test &amp; &lt;test&gt; &quot;quoted&quot;";
  const decoded = HtmlService.decodeHTML(encoded);
  assertEquals(decoded, 'Test & <test> "quoted"');
});
