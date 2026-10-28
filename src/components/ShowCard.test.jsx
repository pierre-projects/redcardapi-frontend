import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ShowCard from "./ShowCard";
import { BACK_CONTENT, getCard } from "../data/cards";

const NOTICE = "Machine translation (Google Translate), not yet checked by a native speaker.";

function machineCard() {
  return {
    ...getCard("fr"),
    official: false,
    source: { type: "machine", engine: "Google Translate", translated_on: "2026-10-28", verified: false },
  };
}

function renderCard(card) {
  return render(
    <ShowCard card={card} back={BACK_CONTENT} onAllLanguages={() => {}} onPrint={() => {}} printHref="/redcards" />
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("switching sides on a phone", () => {
  const swipe = (dx, dy) => {
    const card = document.querySelector(".show-card");
    fireEvent.pointerDown(card, { pointerType: "touch", clientX: 200, clientY: 300 });
    fireEvent.pointerUp(card, { pointerType: "touch", clientX: 200 + dx, clientY: 300 + dy });
  };
  const shownSide = () => (document.querySelector(".show-card-back") ? "back" : "front");

  it("flips with a sideways swipe on the card, both ways", () => {
    renderCard(getCard("es"));
    swipe(-120, 10);
    expect(shownSide()).toBe("back");
    swipe(120, -5);
    expect(shownSide()).toBe("front");
  });

  it("does not flip on a scroll or a short drag", () => {
    renderCard(getCard("es"));
    swipe(-80, 200); // mostly vertical: a scroll
    swipe(-30, 0); // too short
    expect(shownSide()).toBe("front");
  });

  it("jumps back to the top of the card when the side changes", () => {
    renderCard(getCard("es"));
    const page = document.querySelector(".show-page");
    page.getBoundingClientRect = () => ({ top: -400 });
    window.scrollY = 400;
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: /Mostrar al agente/ }));
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });
});

describe("machine-translated card", () => {
  it("shows the notice above the front, not just in the details", () => {
    renderCard(machineCard());
    expect(screen.getByRole("note")).toHaveTextContent(NOTICE);
    expect(screen.getByText(/by Google Translate on 2026-10-28/)).toBeInTheDocument();
  });

  it("drops the notice on the English side, which is not translated", () => {
    renderCard(machineCard());
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[0]);
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
  });

  it("shows no notice on official cards", () => {
    renderCard(getCard("fr"));
    expect(screen.queryByText(/Machine translation/)).not.toBeInTheDocument();
  });
});
