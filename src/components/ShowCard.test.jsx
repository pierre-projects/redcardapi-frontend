import { afterEach, describe, expect, it } from "vitest";
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

afterEach(cleanup);

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
