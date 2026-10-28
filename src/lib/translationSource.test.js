import { describe, expect, it } from "vitest";
import { isMachineTranslation, machineNotice, sourceDescription } from "./translationSource";
import { LANGUAGES } from "../data/cards";

const machine = (extra = {}) => ({
  name: "French",
  source: {
    type: "machine",
    engine: "Google Translate",
    translated_on: "2026-10-28",
    translated_from: "English, ILRC card text",
    verified: false,
    ...extra,
  },
});

describe("translation source", () => {
  it("names the app and says the text is unchecked", () => {
    expect(isMachineTranslation(machine())).toBe(true);
    // Same wording as Source.machine_notice in the backend (printed on PDFs).
    expect(machineNotice(machine())).toBe(
      "Machine translation (Google Translate), not yet checked by a native speaker."
    );
    expect(machineNotice(machine({ verified: true }))).toBe(
      "Machine translation (Google Translate), checked by a native speaker."
    );
  });

  it("describes where machine text came from and when", () => {
    expect(sourceDescription(machine())).toBe(
      "Translated from English, ILRC card text by Google Translate on 2026-10-28."
    );
  });

  it("leaves official cards without a notice", () => {
    expect(LANGUAGES.every((card) => machineNotice(card) === null)).toBe(true);
    expect(sourceDescription({ source: { type: "official", origin: "ILRC" } })).toBe("From ILRC.");
  });
});
