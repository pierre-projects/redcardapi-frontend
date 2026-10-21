import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchWithRetry } from "./api";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const ok = () => new Response("{}", { status: 200 });

describe("fetchWithRetry", () => {
  it("retries network errors and then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(ok());
    vi.stubGlobal("fetch", fetchMock);

    const res = await fetchWithRetry("/x", { retries: 1 });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries 503 and reports a friendly message when it keeps failing", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("/x", { retries: 1 })).rejects.toMatchObject({
      status: 503,
      message: expect.stringMatching(/not ready/),
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry 404", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchWithRetry("/x")).rejects.toBeInstanceOf(ApiError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("maps persistent network failure to a readable error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(fetchWithRetry("/x", { retries: 0 })).rejects.toMatchObject({
      message: expect.stringMatching(/Can't reach the server/),
    });
  });

  it("times out a hung request", async () => {
    vi.stubGlobal("fetch", vi.fn((_, { signal }) => new Promise((_, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason));
    })));

    await expect(fetchWithRetry("/x", { timeoutMs: 20, retries: 0 })).rejects.toMatchObject({
      name: "TimeoutError",
    });
  });
});
