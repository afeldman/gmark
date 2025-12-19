import { Context, Hono } from "hono";
import { bearerAuth } from "hono/middleware.ts";
import { UserLoginSchema, UserRegisterSchema } from "../utils/schemas.ts";
import * as UserService from "../services/user.ts";

export const userRouter = new Hono();

// Middleware für Bearer Token
userRouter.use("/me", bearerAuth({ token: "" })); // Wird überschrieben

// Custom Middleware für Token Validierung
userRouter.use(async (c: Context, next: () => Promise<void>) => {
  const auth = c.req.header("Authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.substring(7);
    try {
      const user = await UserService.validateToken(token);
      if (user) {
        c.set("user", user);
      }
    } catch (err) {
      console.error("Token validation error:", err);
    }
  }
  await next();
});

// Register
userRouter.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const validated = UserRegisterSchema.parse(body);

    const user = await UserService.registerUser(
      validated.username,
      validated.email,
      validated.password,
    );

    return c.json(user, 201);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    if (err.name === "ZodError") {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 400);
  }
});

// Login
userRouter.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const validated = UserLoginSchema.parse(body);

    const result = await UserService.loginUser(
      validated.username,
      validated.password,
    );

    return c.json(result, 200);
  } catch (err) {
    if (err instanceof SyntaxError) {
      return c.json({ error: "Invalid JSON" }, 400);
    }
    if (err.name === "ZodError") {
      return c.json({ error: "Validation error", details: err.errors }, 400);
    }
    return c.json({ error: err.message }, 401);
  }
});

// Get Current User
userRouter.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const userData = await UserService.getUser(user.id);
  return c.json(userData);
});

// Logout
userRouter.post("/logout", async (c) => {
  const auth = c.req.header("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return c.json({ error: "No token provided" }, 401);
  }

  // Token wird einfach invalidiert (Client löscht lokal)
  return c.json({ message: "Logged out successfully" });
});
