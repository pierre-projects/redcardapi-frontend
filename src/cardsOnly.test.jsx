import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

// A cards-only build (no VITE_API_BASE in production).
vi.mock("./api", async (importOriginal) => ({ ...(await importOriginal()), PDF_API_ENABLED: false }));

const { default: App } = await import("./App");

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  window.localStorage.clear();
  // A visitor who chose PDF on another build still gets browser printing.
  window.localStorage.setItem("selected-print-method", "backend");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("cards-only build", () => {
  it("offers browser printing only and never calls the API", () => {
    window.history.replaceState({}, "", "/redcards/es");
    render(<App />);
    expect(screen.queryByRole("radio", { name: /PDF file/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Download PDF/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^Print$/ })).toBeEnabled();
    expect(screen.queryByText(/PDF downloads are unavailable/)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
