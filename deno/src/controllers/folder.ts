import { Hono } from "hono";

export const folderRouter = new Hono();

// Placeholder für Phase 3
folderRouter.get("/", (c) => {
  return c.json({ message: "Folder endpoints coming in Phase 3" });
});

folderRouter.post("/", (c) => {
  return c.json({ message: "Folder endpoints coming in Phase 3" });
});
