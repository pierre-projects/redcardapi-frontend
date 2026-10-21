import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";
import { LANGUAGES, getCard } from "./data/cards";

function renderAt(path) {
  window.history.replaceState({}, "", path);
  return render(<App />);
}

beforeEach(() => {
  // The PDF API is unreachable in every test: cards must not depend on it.
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("home", () => {
  it("lists every language by native name as a one-tap link", () => {
    renderAt("/");
    const links = screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/card/"));
    expect(links).toHaveLength(LANGUAGES.length);
    expect(screen.getByRole("link", { name: /Español/ })).toHaveAttribute("href", "/card/es");
  });

  it("offers the browser language as a big one-tap button", () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["es-MX", "en"]);
    renderAt("/");
    expect(screen.getByRole("link", { name: /Abrir mi tarjeta/ })).toHaveAttribute("href", "/card/es");
  });

  it("searches in the language's own script", () => {
    renderAt("/");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "العربية" } });
    expect(screen.getByRole("link", { name: /العربية/ })).toHaveAttribute("href", "/card/ar");
  });

  it("reports an unknown card code instead of a blank page", () => {
    renderAt("/card/xx");
    expect(screen.getByRole("alert")).toHaveTextContent("xx");
  });
});

describe("card view", () => {
  it("shows the card with no network, canonicalizing alias URLs", () => {
    renderAt("/card/es-MX");
    const spanish = getCard("es");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(spanish.front.header);
    expect(window.location.pathname).toBe("/card/es");
    expect(document.documentElement.lang).toBe("es");
  });

  it("switches to the English side for the officer", () => {
    renderAt("/card/es");
    fireEvent.click(screen.getByRole("button", { name: /Mostrar al agente/ }));
    const article = document.querySelector(".show-card-back");
    expect(within(article).getByText(/5th Amendment/)).toBeInTheDocument();
    expect(article).toHaveAttribute("lang", "en");
  });

  it("sets right-to-left direction for Arabic", () => {
    renderAt("/card/ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(document.querySelector(".show-card-front")).toHaveAttribute("dir", "rtl");
  });

  it("remembers the language for next time", () => {
    renderAt("/card/vi");
    expect(window.localStorage.getItem("selected-language")).toBe("vi");
  });

  it("still renders when browser storage is blocked", () => {
    const blocked = () => {
      throw new DOMException("blocked", "SecurityError");
    };
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    renderAt("/card/am");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(getCard("am").front.header);
  });
});

describe("print workspace", () => {
  it("shows the card preview and a non-blocking notice when the PDF API is down", async () => {
    vi.useFakeTimers();
    renderAt("/redcards/ht");
    expect(screen.getAllByText(getCard("ht").front.header).length).toBeGreaterThan(0);
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    vi.useRealTimers();
    expect(screen.getByRole("alert")).toHaveTextContent(/PDF downloads are unavailable/);
  });
});
