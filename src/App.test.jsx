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
    const hrefs = screen.getAllByRole("link", { name: /العربية/ }).map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["/card/ar", "/card/apd"]);
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

describe("card view print link", () => {
  it("links to the print page for the same language, in the card's language", () => {
    renderAt("/card/es");
    const link = screen.getByRole("link", { name: "Imprimir" });
    expect(link).toHaveAttribute("href", "/redcards/es");
    fireEvent.click(link);
    expect(window.location.pathname).toBe("/redcards/es");
    expect(screen.getByRole("heading", { level: 1, name: "Print paper cards" })).toBeInTheDocument();
  });
});

describe("builder print", () => {
  it("has its own print section that explains what is missing", async () => {
    renderAt("/builder");
    const section = await screen.findByRole("region", { name: "Print" }, { timeout: 5000 });
    const button = within(section).getByRole("button", { name: /Print cards/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAccessibleDescription(/Fill in the required fields to print: Language name/);
    expect(within(section).getByLabelText("Cards per page")).toBeInTheDocument();
    expect(within(section).getByRole("radio", { name: /Color print/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Print From Browser/ })).toBeNull();
  });
});

describe("print workspace", () => {
  it("warns before printing a translation that needs native review", () => {
    renderAt("/redcards/km");
    expect(screen.getByRole("note")).toHaveTextContent(/Not yet reviewed by a native speaker/);
    cleanup();
    renderAt("/redcards/es");
    expect(screen.queryByText(/Not yet reviewed/)).toBeNull();
  });

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

  it("offers a color print that colors the preview and the browser print sheet", () => {
    window.localStorage.setItem("selected-print-method", "browser");
    const { container } = renderAt("/redcards/es");
    expect(screen.queryByRole("radiogroup", { name: "Card color" })).toBeNull();
    expect(container.querySelector(".print-sheet--color")).toBeNull();

    fireEvent.click(screen.getByRole("radio", { name: /Color print/ }));
    const swatches = screen.getByRole("radiogroup", { name: "Card color" });
    expect(within(swatches).getByRole("radio", { name: "Red" })).toBeChecked();

    fireEvent.click(within(swatches).getByRole("radio", { name: "Blue" }));
    const sheet = container.querySelector(".print-sheet--color");
    expect(sheet.style.getPropertyValue("--card-bg")).toBe("#1D4ED8");
    expect(sheet.style.getPropertyValue("--card-fg")).toBe("#FFFFFF");
    expect(window.localStorage.getItem("selected-print-style")).toBe("color");
    expect(window.localStorage.getItem("selected-print-color")).toBe("#1D4ED8");
  });
});
