import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import SpeechToText from "./SpeechToText";

beforeEach(() => {
  global.fetch = jest.fn();
  global.speechSynthesis = { speak: jest.fn() };
  global.SpeechSynthesisUtterance = function (text) {
    this.text = text;
  };
  global.alert = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe(SpeechToText, () => {
    it("initial user speech text displayed is set to initial text value", () => {
        const { getByTestId } = render(<SpeechToText />);
        const displayValue = getByTestId("userSpeach").value;
        expect(displayValue).toBe("");

    });
});

describe("SpeechToText component", () => {
  test("renders record button and textareas", () => {
    render(<SpeechToText />);
    expect(screen.getByRole("button")).toHaveTextContent("🎙️ Record Speech");
    expect(screen.getByPlaceholderText(/Your speech will appear here/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/LLM response will appear here/)).toBeInTheDocument();
  });

  test("startListening alerts if SpeechRecognition not available", () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    render(<SpeechToText />);
    fireEvent.click(screen.getByRole("button"));
    expect(global.alert).toHaveBeenCalledWith("Speech recognition error.");
  });
});
