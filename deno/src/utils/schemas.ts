import { z } from "zod";

export const UserRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export const UserLoginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(1),
});

export const BookmarkCreateSchema = z.object({
  title: z.string().min(1).max(500),
  url: z.string().url(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  folderId: z.number().optional(),
});

export const BookmarkUpdateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
  folderId: z.number().optional(),
});

export const FolderCreateSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.number().optional(),
});

export const FolderUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.number().optional(),
});

export type UserRegister = z.infer<typeof UserRegisterSchema>;
export type UserLogin = z.infer<typeof UserLoginSchema>;
export type BookmarkCreate = z.infer<typeof BookmarkCreateSchema>;
export type BookmarkUpdate = z.infer<typeof BookmarkUpdateSchema>;
export type FolderCreate = z.infer<typeof FolderCreateSchema>;
export type FolderUpdate = z.infer<typeof FolderUpdateSchema>;
