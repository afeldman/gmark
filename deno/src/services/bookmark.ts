import { getDB } from "../utils/db.ts";

export async function createBookmark(
  userId: number,
  title: string,
  url: string,
  data?: {
    description?: string;
    tags?: string;
    category?: string;
    notes?: string;
    folder_id?: number;
  },
) {
  const db = getDB();
  return db.createBookmark(userId, title, url, data);
}

export async function getBookmarks(userId: number) {
  const db = getDB();
  return db.getBookmarksByUserId(userId);
}

export async function getBookmark(id: number) {
  const db = getDB();
  const bookmark = db.getBookmarkById(id);
  if (!bookmark) {
    throw new Error("Bookmark not found");
  }
  return bookmark;
}

export async function updateBookmark(
  id: number,
  userId: number,
  data: Partial<{
    title: string;
    description: string;
    tags: string;
    category: string;
    notes: string;
    folder_id: number;
  }>,
) {
  const db = getDB();
  const bookmark = db.getBookmarkById(id);

  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  if (bookmark.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  return db.updateBookmark(id, data);
}

export async function deleteBookmark(id: number, userId: number) {
  const db = getDB();
  const bookmark = db.getBookmarkById(id);

  if (!bookmark) {
    throw new Error("Bookmark not found");
  }

  if (bookmark.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  db.deleteBookmark(id);
  return { success: true };
}

// ==================== Folders ====================

export async function createFolder(
  userId: number,
  name: string,
  parentId?: number,
) {
  const db = getDB();

  // Prüfe ob Parent Folder existiert
  if (parentId) {
    const parent = db.getFolderById(parentId);
    if (!parent || parent.user_id !== userId) {
      throw new Error("Parent folder not found");
    }
  }

  return db.createFolder(userId, name, parentId);
}

export async function getFolders(userId: number) {
  const db = getDB();
  return db.getFoldersByUserId(userId);
}

export async function getFolder(id: number) {
  const db = getDB();
  const folder = db.getFolderById(id);
  if (!folder) {
    throw new Error("Folder not found");
  }
  return folder;
}

export async function updateFolder(
  id: number,
  userId: number,
  data: Partial<{ name: string; parent_id: number }>,
) {
  const db = getDB();
  const folder = db.getFolderById(id);

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  // Prüfe Parent Folder
  if (data.parent_id) {
    const parent = db.getFolderById(data.parent_id);
    if (!parent || parent.user_id !== userId) {
      throw new Error("Parent folder not found");
    }
  }

  return db.updateFolder(id, data.name, data.parent_id);
}

export async function deleteFolder(id: number, userId: number) {
  const db = getDB();
  const folder = db.getFolderById(id);

  if (!folder) {
    throw new Error("Folder not found");
  }

  if (folder.user_id !== userId) {
    throw new Error("Unauthorized");
  }

  // Lösche alle Bookmarks in diesem Folder
  db.deleteBookmarksByFolder(id);

  // Lösche Folder
  db.deleteFolder(id);

  return { success: true, deleted_bookmarks: 0 };
}
