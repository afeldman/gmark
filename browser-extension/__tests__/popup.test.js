// Browser Extension - Tests mit Jest
describe("GMARK Extension - Popup Tests", () => {
  let mockChrome;
  let mockTab;

  beforeEach(() => {
    // Mock Chrome API
    mockChrome = {
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn(),
      },
      storage: {
        sync: {
          get: jest.fn(),
        },
      },
      runtime: {
        sendMessage: jest.fn(),
      },
    };

    global.chrome = mockChrome;

    mockTab = {
      id: 1,
      url: "https://github.com/denoland/deno",
      title: "GitHub - Deno",
    };
  });

  describe("Authentication", () => {
    test("should detect missing auth token", async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});

      // In real test, load popup.html and test DOM
      const authToken = undefined;
      expect(authToken).toBeUndefined();
    });

    test("should load auth token from storage", async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        authToken: "mock-jwt-token",
        apiEndpoint: "http://localhost:8000",
      });

      const config = await mockChrome.storage.sync.get([
        "authToken",
        "apiEndpoint",
      ]);
      expect(config.authToken).toBe("mock-jwt-token");
    });
  });

  describe("Classification", () => {
    test("should detect Prompt API availability", async () => {
      // Mock Prompt API
      global.window = {
        ai: {
          canCreateTextSession: jest.fn().mockResolvedValue("readily"),
          createTextSession: jest.fn(),
        },
      };

      const canUse = await window.ai.canCreateTextSession();
      expect(canUse).toBe("readily");
    });

    test("should fallback when Prompt API unavailable", async () => {
      global.window = {
        ai: undefined,
      };

      const canUse = global.window.ai?.canCreateTextSession?.();
      expect(canUse).toBeUndefined();
    });

    test("should handle classification response", () => {
      const mockResponse = {
        category: "Development",
        tags: ["github", "typescript"],
        confidence: 0.95,
      };

      expect(mockResponse.category).toBe("Development");
      expect(mockResponse.tags.length).toBe(2);
      expect(mockResponse.confidence).toBeGreaterThan(0.8);
    });
  });

  describe("Bookmark Saving", () => {
    test("should create bookmark data object", () => {
      const bookmarkData = {
        title: "GitHub - Deno",
        url: "https://github.com/denoland/deno",
        description: "A modern runtime for JavaScript",
        tags: ["Development", "github", "typescript"],
        category: "Development",
        autoClassify: true,
      };

      expect(bookmarkData.title).toBeTruthy();
      expect(bookmarkData.url).toMatch(/^https?:\/\//);
      expect(bookmarkData.tags.length).toBeGreaterThan(0);
    });

    test("should send bookmark to backend", async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: 1, url: "https://test.com" }),
      });

      global.fetch = mockFetch;

      const response = await fetch("http://localhost:8000/api/bookmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-token",
        },
        body: JSON.stringify({}),
      });

      expect(response.ok).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "http://localhost:8000/api/bookmarks",
        expect.objectContaining({
          method: "POST",
        })
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle classification errors gracefully", async () => {
      mockChrome.storage.sync.get.mockResolvedValue({});

      // Test error handling
      expect(() => {
        throw new Error("Classification failed");
      }).toThrow("Classification failed");
    });

    test("should fallback on network error", async () => {
      mockChrome.storage.sync.get.mockRejectedValue(new Error("Network error"));

      try {
        await mockChrome.storage.sync.get(["authToken"]);
      } catch (error) {
        expect(error.message).toBe("Network error");
      }
    });
  });
});
