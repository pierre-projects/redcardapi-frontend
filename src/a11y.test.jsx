import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import axe from "axe-core";
import App from "./App";

// jsdom cannot compute layout or colors, so contrast is checked in a real
// browser instead; every other WCAG 2.x A/AA rule runs here.
const AXE_OPTIONS = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] },
  rules: { "color-contrast": { enabled: false } },
};

async function violations(container) {
  const { violations: found } = await axe.run(container, AXE_OPTIONS);
  return found.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}

async function renderAt(path) {
  window.history.replaceState({}, "", path);
  let result;
  await act(async () => {
    result = render(<App />);
  });
  return result;
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
  window.localStorage.clear();
  Element.prototype.scrollIntoView ??= () => {};
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("accessibility (axe)", () => {
  it.each(["/", "/card/es", "/card/ar", "/redcards/es"])("%s has no violations", async (path) => {
    await renderAt(path);
    expect(await violations(document.body)).toEqual([]);
  });

  it("print page with color print and browser sheet has no violations", async () => {
    window.localStorage.setItem("selected-print-method", "browser");
    window.localStorage.setItem("selected-print-style", "color");
    await renderAt("/redcards/es");
    expect(await violations(document.body)).toEqual([]);
  });

  it("open language picker has no violations", async () => {
    await renderAt("/redcards/es");
    fireEvent.click(screen.getByRole("button", { name: /Language/ }));
    expect(await violations(document.body)).toEqual([]);
    fireEvent.change(screen.getByRole("combobox", { name: "Search languages" }), { target: { value: "zzzz" } });
    expect(await violations(document.body)).toEqual([]);
  });

  it("builder page has no violations", async () => {
    await renderAt("/builder");
    await screen.findByRole("region", { name: /builder/i }, { timeout: 5000 });
    expect(await violations(document.body)).toEqual([]);
  });
});
