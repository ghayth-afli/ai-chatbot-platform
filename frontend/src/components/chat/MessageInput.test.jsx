/**
 * Tests for MessageInput component
 * Using React Testing Library
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageInput } from "../components/chat/MessageInput";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

describe("MessageInput Component", () => {
  const mockOnSend = jest.fn();
  const mockOnModelChange = jest.fn();

  beforeEach(() => {
    mockOnSend.mockClear();
    mockOnModelChange.mockClear();
  });

  it("renders input field", () => {
    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);
    expect(textarea).toBeInTheDocument();
  });

  it("renders model selector", () => {
    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const modelSelect = screen.getByDisplayValue("deepseek");
    expect(modelSelect).toBeInTheDocument();
  });

  it("sends message on button click", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);
    const sendButton = screen.getByRole("button", { name: /send|arrow/i });

    await user.type(textarea, "Hello AI");
    await user.click(sendButton);

    expect(mockOnSend).toHaveBeenCalledWith("Hello AI", "deepseek");
  });

  it("sends message on Shift+Enter", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);

    await user.type(textarea, "Hello AI");
    await user.keyboard("{Shift>}{Enter}{/Shift}");

    expect(mockOnSend).toHaveBeenCalledWith("Hello AI", "deepseek");
  });

  it("clears input after sending", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);
    const sendButton = screen.getByRole("button", { name: /send|arrow/i });

    await user.type(textarea, "Hello");
    await user.click(sendButton);

    expect(textarea.value).toBe("");
  });

  it("disables input when disabled prop is true", () => {
    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={true}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);
    const sendButton = screen.getByRole("button", { name: /send|arrow/i });

    expect(textarea).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it("shows character count", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);

    await user.type(textarea, "Hello");

    // Character count should be visible
    expect(screen.getByText(/5\s*\/\s*5000/i)).toBeInTheDocument();
  });

  it("prevents sending messages over 5000 characters", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const textarea = screen.getByPlaceholderText(/chat:message/i);
    const longText = "a".repeat(5001);

    await user.type(textarea, longText);

    // Should not allow typing beyond 5000
    expect(textarea.value.length).toBeLessThanOrEqual(5000);
  });

  it("changes model on selection", async () => {
    const user = userEvent.setup();

    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={false}
      />,
    );

    const modelSelect = screen.getByDisplayValue("deepseek");

    await user.selectOptions(modelSelect, "llama3");

    expect(mockOnModelChange).toHaveBeenCalledWith("llama3");
  });

  it("shows loading state", () => {
    render(
      <MessageInput
        onSendMessage={mockOnSend}
        onModelChange={mockOnModelChange}
        selectedModel="deepseek"
        disabled={false}
        loading={true}
      />,
    );

    const sendButton = screen.getByRole("button", {
      name: /send|arrow|loading/i,
    });
    expect(sendButton).toBeDisabled();
  });
});
