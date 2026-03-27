import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

test("App renders nexus AI title", () => {
  render(<App />);
  expect(screen.getByText(/nexus AI/i)).toBeInTheDocument();
});

test("App renders subtitle", () => {
  render(<App />);
  expect(screen.getByText(/Multi-model chatbot platform/i)).toBeInTheDocument();
});
