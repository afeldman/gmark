import * as BookmarkService from "../services/bookmark.ts";
import * as HtmlService from "../services/html.ts";
import * as AiService from "../services/ai.ts";

// Extrahiere User aus Request Context (gespeichert von Auth Middleware)
async function getUserIdFromToken(req: Request): Promise<number | null> {
  const auth = req.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return null;
  }

  const token = auth.substring(7);
  // Decode JWT einfach um userId zu bekommen
  try {
    const [, payloadB64] = token.split(".");
    const padding = (4 - (payloadB64.length % 4)) % 4;
    const paddedPayload = payloadB64 + "=".repeat(padding);
    const decodedPayload = JSON.parse(
      atob(paddedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decodedPayload.userId;
  } catch {
    return null;
  }
}

export async function handleBookmarkPost(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    if (pathname === "/api/bookmarks") {
      const {
        title,
        url: bookmarkUrl,
        description,
        tags,
        category,
        notes,
        folder_id,
        autoClassify = false,
      } = body;
      if (!title || !bookmarkUrl) {
        return new Response(
          JSON.stringify({ error: "Title and URL are required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      let finalDescription = description;
      let finalCategory = category;
      let finalTags = tags || [];

      // Auto-Classification wenn gewünscht
      if (autoClassify) {
        try {
          // Versuche HTML Metadata zu extrahieren
          const metadata = await HtmlService.extractMetadata(bookmarkUrl);

          // Klassifiziere basierend auf extrahiertem Content
          const classification = await AiService.classifyBookmark(
            title,
            metadata?.description || description || "",
            metadata?.keywords || [],
            { useOpenAI: true, useLocalLLM: true, usePatterns: true },
          );

          // Übernehme nur wenn keine Werte gesetzt sind
          if (!finalDescription && metadata?.description) {
            finalDescription = metadata.description;
          }
          if (!finalCategory) {
            finalCategory = classification.category;
          }
          if (!finalTags || finalTags.length === 0) {
            finalTags = classification.tags;
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          console.warn("Auto-classification failed:", message);
          // Fallback: Weitermachen ohne auto-classification
        }
      }

      const bookmark = await BookmarkService.createBookmark(
        userId,
        title,
        bookmarkUrl,
        {
          description: finalDescription,
          tags: finalTags,
          category: finalCategory,
          notes,
          folder_id,
        },
      );

      return new Response(JSON.stringify(bookmark), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (pathname === "/api/folders") {
      const { name, parent_id } = body;
      if (!name) {
        return new Response(
          JSON.stringify({ error: "Folder name is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const folder = await BookmarkService.createFolder(
        userId,
        name,
        parent_id,
      );

      return new Response(JSON.stringify(folder), {
        status: 201,
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

export async function handleBookmarkGet(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /api/bookmarks/:id
    const bookmarkMatch = pathname.match(/^\/api\/bookmarks\/(\d+)$/);
    if (bookmarkMatch) {
      const id = parseInt(bookmarkMatch[1]);
      const bookmark = await BookmarkService.getBookmark(id);

      if (bookmark.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(bookmark), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /api/bookmarks
    if (pathname === "/api/bookmarks") {
      const bookmarks = await BookmarkService.getBookmarks(userId);
      return new Response(JSON.stringify(bookmarks), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /api/folders/:id
    const folderMatch = pathname.match(/^\/api\/folders\/(\d+)$/);
    if (folderMatch) {
      const id = parseInt(folderMatch[1]);
      const folder = await BookmarkService.getFolder(id);

      if (folder.user_id !== userId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify(folder), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // GET /api/folders
    if (pathname === "/api/folders") {
      const folders = await BookmarkService.getFolders(userId);
      return new Response(JSON.stringify(folders), {
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
    const status = message.includes("not found") ? 404 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleBookmarkPut(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // PUT /api/bookmarks/:id
    const bookmarkMatch = pathname.match(/^\/api\/bookmarks\/(\d+)$/);
    if (bookmarkMatch) {
      const id = parseInt(bookmarkMatch[1]);
      const updated = await BookmarkService.updateBookmark(id, userId, body);

      return new Response(JSON.stringify(updated), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // PUT /api/folders/:id
    const folderMatch = pathname.match(/^\/api\/folders\/(\d+)$/);
    if (folderMatch) {
      const id = parseInt(folderMatch[1]);
      const updated = await BookmarkService.updateFolder(id, userId, body);

      return new Response(JSON.stringify(updated), {
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
    const status = message.includes("not found")
      ? 404
      : message.includes("Unauthorized")
      ? 403
      : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function handleBookmarkDelete(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  try {
    const userId = await getUserIdFromToken(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // DELETE /api/bookmarks/:id
    const bookmarkMatch = pathname.match(/^\/api\/bookmarks\/(\d+)$/);
    if (bookmarkMatch) {
      const id = parseInt(bookmarkMatch[1]);
      const result = await BookmarkService.deleteBookmark(id, userId);

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // DELETE /api/folders/:id
    const folderMatch = pathname.match(/^\/api\/folders\/(\d+)$/);
    if (folderMatch) {
      const id = parseInt(folderMatch[1]);
      const result = await BookmarkService.deleteFolder(id, userId);

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
    const status = message.includes("not found")
      ? 404
      : message.includes("Unauthorized")
      ? 403
      : 400;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }
}
