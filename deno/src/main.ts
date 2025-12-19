// Lade Environment Variablen von .env
const envFile = await Deno.readTextFile(".env").catch(() => "");
envFile.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && key.trim() && !key.startsWith("#")) {
    Deno.env.set(
      key.trim(),
      valueParts.join("=").trim().replace(/^"(.*)"$/, "$1")
    );
  }
});

// Importiere Services
import * as UserService from "./services/user.ts";
import * as BookmarkService from "./controllers/bookmark.ts";
import { getDB, closeDB } from "./utils/db.ts";

// Initialisiere DB
getDB();

const port = parseInt(Deno.env.get("PORT") || "8000");

// ==================== User Handlers ====================

async function handleUserPost(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const body = await req.json();

    if (pathname === "/api/users/register") {
      const { username, email, password } = body;
      if (!username || !email || !password) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const user = await UserService.registerUser(username, email, password);
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname === "/api/users/login") {
      const { username, password } = body;
      if (!username || !password) {
        return new Response(JSON.stringify({ error: "Missing fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      const result = await UserService.loginUser(username, password);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleUserGet(req: Request): Promise<Response> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = auth.substring(7);
  try {
    const user = await UserService.validateToken(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// ==================== Main Request Handler ====================

function handleRequest(req: Request): Response | Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // CORS Headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }

  // Health Check
  if (pathname === "/health" && req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...headers },
    });
  }

  // User Endpoints
  if (pathname.startsWith("/api/users")) {
    if (req.method === "POST") {
      return handleUserPost(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
    if (req.method === "GET") {
      return handleUserGet(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
  }

  // Bookmark Endpoints
  if (pathname.startsWith("/api/bookmarks") || pathname.startsWith("/api/folders")) {
    if (req.method === "POST") {
      return BookmarkService.handleBookmarkPost(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
    if (req.method === "GET") {
      return BookmarkService.handleBookmarkGet(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
    if (req.method === "PUT") {
      return BookmarkService.handleBookmarkPut(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
    if (req.method === "DELETE") {
      return BookmarkService.handleBookmarkDelete(req).then((res) => {
        const corsHeaders = new Headers(res.headers);
        Object.entries(headers).forEach(([k, v]) => corsHeaders.set(k, v));
        return new Response(res.body, {
          status: res.status,
          headers: corsHeaders,
        });
      });
    }
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

console.log(`�� Server running on http://localhost:${port}`);

Deno.serve({ port }, handleRequest);

// Cleanup on exit
globalThis.addEventListener("unload", () => {
  closeDB();
});
