import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders the hero headline", () => {
    render(<App />);
    expect(
      screen.getByRole("heading", { level: 1, name: /private semantic recall/i }),
    ).toBeInTheDocument();
  });

  it("shows both retrieval paths in the fork section", () => {
    render(<App />);
    expect(screen.getByText(/Native Ollama path/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Harrier sentence-transformers shim/i),
    ).toBeInTheDocument();
  });

  it("documents all Ollama-compatible endpoints", () => {
    render(<App />);
    for (const path of [
      "/api/embed",
      "/api/embeddings",
      "/health",
      "/api/tags",
      "/api/version",
    ]) {
      expect(screen.getAllByText(path).length).toBeGreaterThan(0);
    }
  });

  it("keeps app copy focused on the Harrier solution", () => {
    render(<App />);
    expect(screen.queryByText(/GitHub Pages ready/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/npm run build/i)).not.toBeInTheDocument();
  });
});
