// In-Memory Database Layer für Deno
// Interfaces für alle Datentypen

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

interface ActiveSession {
  id: number;
  user_id: number;
  token: string;
  expires_at: string;
  created_at: string;
}

interface BookmarkFolder {
  id: number;
  user_id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
  updated_at: string;
}

interface Bookmark {
  id: number;
  user_id: number;
  title: string;
  url: string;
  description?: string;
  tags?: string;
  category?: string;
  notes?: string;
  folder_id?: number;
  created_at: string;
  updated_at: string;
}

class SimpleDB {
  private users: Map<number, User> = new Map();
  private sessions: Map<number, ActiveSession> = new Map();
  private folders: Map<number, BookmarkFolder> = new Map();
  private bookmarks: Map<number, Bookmark> = new Map();

  private nextUserId = 1;
  private nextSessionId = 1;
  private nextFolderId = 1;
  private nextBookmarkId = 1;

  // ==================== Users ====================
  createUser(username: string, email: string, password: string): number {
    const id = this.nextUserId++;
    this.users.set(id, {
      id,
      username,
      email,
      password,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return id;
  }

  getUserByUsername(username: string): User | null {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return null;
  }

  getUserById(id: number): User | null {
    return this.users.get(id) || null;
  }

  // ==================== Sessions ====================
  createSession(user_id: number, token: string, expires_at: string): number {
    const id = this.nextSessionId++;
    this.sessions.set(id, {
      id,
      user_id,
      token,
      expires_at,
      created_at: new Date().toISOString(),
    });
    return id;
  }

  getSessionByToken(token: string): ActiveSession | null {
    for (const session of this.sessions.values()) {
      if (session.token === token) return session;
    }
    return null;
  }

  deleteSession(token: string): void {
    for (const [key, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(key);
        break;
      }
    }
  }

  // ==================== Folders ====================
  createFolder(user_id: number, name: string, parent_id?: number): BookmarkFolder {
    const id = this.nextFolderId++;
    const folder: BookmarkFolder = {
      id,
      user_id,
      name,
      parent_id: parent_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.folders.set(id, folder);
    return folder;
  }

  getFoldersByUserId(user_id: number): BookmarkFolder[] {
    const result: BookmarkFolder[] = [];
    for (const folder of this.folders.values()) {
      if (folder.user_id === user_id) result.push(folder);
    }
    return result;
  }

  getFolderById(id: number): BookmarkFolder | null {
    return this.folders.get(id) || null;
  }

  updateFolder(id: number, name?: string, parent_id?: number): BookmarkFolder | null {
    const folder = this.folders.get(id);
    if (!folder) return null;

    if (name) folder.name = name;
    if (parent_id !== undefined) folder.parent_id = parent_id;
    folder.updated_at = new Date().toISOString();

    this.folders.set(id, folder);
    return folder;
  }

  deleteFolder(id: number): boolean {
    return this.folders.delete(id);
  }

  // ==================== Bookmarks ====================
  createBookmark(
    user_id: number,
    title: string,
    url: string,
    data?: {
      description?: string;
      tags?: string;
      category?: string;
      notes?: string;
      folder_id?: number;
    }
  ): Bookmark {
    const id = this.nextBookmarkId++;
    const bookmark: Bookmark = {
      id,
      user_id,
      title,
      url,
      description: data?.description,
      tags: data?.tags,
      category: data?.category,
      notes: data?.notes,
      folder_id: data?.folder_id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  getBookmarksByUserId(user_id: number): Bookmark[] {
    const result: Bookmark[] = [];
    for (const bookmark of this.bookmarks.values()) {
      if (bookmark.user_id === user_id) result.push(bookmark);
    }
    return result;
  }

  getBookmarkById(id: number): Bookmark | null {
    return this.bookmarks.get(id) || null;
  }

  getBookmarksByFolderId(folder_id: number): Bookmark[] {
    const result: Bookmark[] = [];
    for (const bookmark of this.bookmarks.values()) {
      if (bookmark.folder_id === folder_id) result.push(bookmark);
    }
    return result;
  }

  updateBookmark(id: number, data: Partial<Bookmark>): Bookmark | null {
    const bookmark = this.bookmarks.get(id);
    if (!bookmark) return null;

    Object.assign(bookmark, data);
    bookmark.updated_at = new Date().toISOString();
    this.bookmarks.set(id, bookmark);
    return bookmark;
  }

  deleteBookmark(id: number): boolean {
    return this.bookmarks.delete(id);
  }

  deleteBookmarksByFolder(folder_id: number): number {
    let deleted = 0;
    for (const [key, bookmark] of this.bookmarks.entries()) {
      if (bookmark.folder_id === folder_id) {
        this.bookmarks.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}

const db = new SimpleDB();

export function getDB() {
  return db;
}

export function closeDB() {
  console.log("✅ Database closed");
}
