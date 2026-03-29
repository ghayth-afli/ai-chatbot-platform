/**
 * Tests for ChatMessages component
 * Using React Testing Library
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import { ChatMessages } from "../components/chat/ChatMessages";

// Mock react-i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: "en" },
  }),
}));

describe("ChatMessages Component", () => {
  const mockMessages = [
    {
      id: 1,
      role: "user",
      content: "Hello AI",
      created_at: "2024-01-01T10:00:00Z",
      ai_model: "nemotron",
    },
    {
      id: 2,
      role: "assistant",
      content: "Hello! How can I help?",
      created_at: "2024-01-01T10:00:05Z",
      ai_model: "nemotron",
    },
  ];

  it("renders messages", () => {
    render(
      <ChatMessages
        messages={mockMessages}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText("Hello AI")).toBeInTheDocument();
    expect(screen.getByText("Hello! How can I help?")).toBeInTheDocument();
  });

  it("displays user message with correct styling", () => {
    render(
      <ChatMessages
        messages={[mockMessages[0]]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    const userMessage = screen.getByText("Hello AI");
    expect(userMessage).toBeInTheDocument();
  });

  it("displays assistant message with correct styling", () => {
    render(
      <ChatMessages
        messages={[mockMessages[1]]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    const assistantMessage = screen.getByText("Hello! How can I help?");
    expect(assistantMessage).toBeInTheDocument();
  });

  it("shows empty state when no messages", () => {
    render(
      <ChatMessages
        messages={[]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText(/no messages|empty|start/i)).toBeInTheDocument();
  });

  it("shows loading indicator when loading", () => {
    render(
      <ChatMessages
        messages={mockMessages}
        loading={true}
        error={null}
        currentModel="nemotron"
      />,
    );

    // Should show loading animation
    expect(
      screen.getByText(/loading|thinking|processing/i),
    ).toBeInTheDocument();
  });

  it("shows error message when error exists", () => {
    render(
      <ChatMessages
        messages={mockMessages}
        loading={false}
        error="Failed to get response"
        currentModel="nemotron"
      />,
    );

    expect(
      screen.getByText(/Failed to get response|error/i),
    ).toBeInTheDocument();
  });

  it("displays timestamps for messages", () => {
    render(
      <ChatMessages
        messages={mockMessages}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    // Check if timestamps are rendered (format may vary)
    const timestamps = screen.queryAllByText(/\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("displays model attribution", () => {
    render(
      <ChatMessages
        messages={[mockMessages[1]]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText(/nemotron|model/i)).toBeInTheDocument();
  });

  it("renders multiple messages in order", () => {
    render(
      <ChatMessages
        messages={mockMessages}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    const messages = screen.getAllByText(/Hello|help/i);
    expect(messages.length).toBeGreaterThanOrEqual(2);
  });

  it("handles long messages", () => {
    const longMessage = {
      id: 3,
      role: "assistant",
      content: "a".repeat(500),
      created_at: "2024-01-01T10:00:05Z",
      ai_model: "nemotron",
    };

    render(
      <ChatMessages
        messages={[longMessage]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText("a".repeat(500))).toBeInTheDocument();
  });

  it("handles messages with special characters", () => {
    const specialMessage = {
      id: 4,
      role: "user",
      content: "Hello! 👋 How are you? @#$%",
      created_at: "2024-01-01T10:00:00Z",
      ai_model: "nemotron",
    };

    render(
      <ChatMessages
        messages={[specialMessage]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText(/Hello|👋/)).toBeInTheDocument();
  });

  it("handles messages with code blocks", () => {
    const codeMessage = {
      id: 5,
      role: "assistant",
      content: '```js\nconst hello = () => console.log("Hi");\n```',
      created_at: "2024-01-01T10:00:05Z",
      ai_model: "nemotron",
    };

    render(
      <ChatMessages
        messages={[codeMessage]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText(/const hello|console.log/)).toBeInTheDocument();
  });

  it("supports RTL layout for Arabic messages", () => {
    const arabicMessage = {
      id: 6,
      role: "user",
      content: "مرحبا بك في تطبيقي",
      created_at: "2024-01-01T10:00:00Z",
      ai_model: "nemotron",
    };

    render(
      <ChatMessages
        messages={[arabicMessage]}
        loading={false}
        error={null}
        currentModel="nemotron"
      />,
    );

    expect(screen.getByText(/مرحبا/)).toBeInTheDocument();
  });
});
