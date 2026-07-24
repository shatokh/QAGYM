import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function BrokenComponent(): never {
  throw new Error("Sensitive render detail");
}

describe("AppErrorBoundary", () => {
  it("renders a safe accessible fallback without raw exception text", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Something went wrong",
      }),
    ).toBeVisible();
    expect(screen.queryByText("Sensitive render detail")).not.toBeInTheDocument();
  });
});
