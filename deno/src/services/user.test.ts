// Tests für User Service
// deno-lint-ignore no-unused-vars
import { assertEquals } from "std/assert";
import * as UserService from "../src/services/user.ts";

Deno.test("User Service - Register", async () => {
  // deno-lint-ignore no-unused-vars
  const user = await UserService.registerUser(
    "testuser",
    "test@example.com",
    "password123"
  );

  assertEquals(user.username, "testuser");
  assertEquals(user.email, "test@example.com");
});

Deno.test("User Service - Login Success", async () => {
  const user = await UserService.registerUser(
    "loginuser",
    "login@example.com",
    "securepass"
  );

  const result = await UserService.loginUser("loginuser", "securepass");
  assertEquals(result.user.username, "loginuser");
  assertEquals(typeof result.token, "string");
});

Deno.test("User Service - Login Failure", async () => {
  // deno-lint-ignore no-unused-vars
  const user = await UserService.registerUser(
    "failuser",
    "fail@example.com",
    "password123"
  );

  const result = await UserService.loginUser("failuser", "wrongpassword");
  assertEquals(result, null);
});

Deno.test("User Service - Get User", async () => {
  const user = await UserService.registerUser(
    "getuser",
    "get@example.com",
    "password"
  );

  const retrieved = await UserService.getUser(user.id);
  assertEquals(retrieved?.username, "getuser");
});

Deno.test("User Service - Validate Token", async () => {
  const user = await UserService.registerUser(
    "tokenuser",
    "token@example.com",
    "password"
  );

  const result = await UserService.loginUser("tokenuser", "password");
  const validated = await UserService.validateToken(result.token);

  assertEquals(validated?.id, user.id);
  assertEquals(validated?.username, "tokenuser");
});

Deno.test("User Service - Duplicate Username", async () => {
  await UserService.registerUser("duplicate", "dup1@example.com", "password");

  const result = await UserService.registerUser(
    "duplicate",
    "dup2@example.com",
    "password"
  );

  assertEquals(result, null);
});
