import { describe, expect, it, vi } from "vitest";
import { CatalogApiError } from "../features/catalog/api/catalog.errors";
import { createAppQueryClient } from "./query-client";

describe("application query client", () => {
  it("does not retry deterministic client or contract failures", async () => {
    const queryClient = createAppQueryClient();
    const clientFailure = vi.fn().mockRejectedValue(
      new CatalogApiError("Invalid request.", {
        kind: "http",
        status: 400,
      }),
    );
    const contractFailure = vi.fn().mockRejectedValue(
      new CatalogApiError("Contract mismatch.", {
        kind: "contract",
        status: 200,
      }),
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ["client-failure"],
        queryFn: clientFailure,
      }),
    ).rejects.toMatchObject({
      kind: "http",
      status: 400,
    });
    await expect(
      queryClient.fetchQuery({
        queryKey: ["contract-failure"],
        queryFn: contractFailure,
      }),
    ).rejects.toMatchObject({
      kind: "contract",
      status: 200,
    });

    expect(clientFailure).toHaveBeenCalledTimes(1);
    expect(contractFailure).toHaveBeenCalledTimes(1);
  });

  it("retries a transient network failure once", async () => {
    const queryClient = createAppQueryClient();
    const networkFailure = vi.fn().mockRejectedValue(
      new CatalogApiError("Network failure.", {
        kind: "network",
      }),
    );

    await expect(
      queryClient.fetchQuery({
        queryKey: ["network-failure"],
        queryFn: networkFailure,
      }),
    ).rejects.toMatchObject({
      kind: "network",
    });
    expect(networkFailure).toHaveBeenCalledTimes(2);
  });
});
