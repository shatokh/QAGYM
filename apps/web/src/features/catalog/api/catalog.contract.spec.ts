import { describe, expect, it } from "vitest";
import {
  apiErrorEnvelopeSchema,
  catalogDetailResponseSchema,
  catalogListResponseSchema,
} from "./catalog.contract";
import {
  catalogDetailResponseFixture,
  catalogListResponseFixture,
} from "../../../test/catalog-fixtures";

describe("catalog contract schemas", () => {
  it("accepts the documented list and detail shapes", () => {
    expect(
      catalogListResponseSchema.parse(catalogListResponseFixture),
    ).toEqual(catalogListResponseFixture);
    expect(
      catalogDetailResponseSchema.parse(catalogDetailResponseFixture),
    ).toEqual(catalogDetailResponseFixture);
  });

  it("rejects leaked fields and inconsistent stock state", () => {
    const leakedRecord = {
      ...catalogListResponseFixture,
      data: [
        {
          ...catalogListResponseFixture.data[0],
          id: 1,
        },
      ],
    };
    const inconsistentStock = {
      ...catalogDetailResponseFixture,
      data: {
        ...catalogDetailResponseFixture.data,
        stock: {
          quantity: 0,
          inStock: true,
        },
      },
    };

    expect(catalogListResponseSchema.safeParse(leakedRecord).success).toBe(
      false,
    );
    expect(catalogDetailResponseSchema.safeParse(inconsistentStock).success).toBe(
      false,
    );
  });

  it("requires the stable API error envelope", () => {
    expect(
      apiErrorEnvelopeSchema.parse({
        error: {
          code: "COMIC_NOT_FOUND",
          message: "Comic not found.",
          details: [],
        },
      }),
    ).toEqual({
      error: {
        code: "COMIC_NOT_FOUND",
        message: "Comic not found.",
        details: [],
      },
    });
  });
});
