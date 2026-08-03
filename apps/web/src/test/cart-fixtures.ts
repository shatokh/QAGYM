import type { CartResponse } from "../features/cart/api/cart.contract";

export const emptyCartResponseFixture: CartResponse = {
  data: {
    cart: {
      items: [],
      totalItems: 0,
      subtotal: {
        amountMinor: 0,
        currencyCode: "USD",
      },
    },
  },
};

export const populatedCartResponseFixture: CartResponse = {
  data: {
    cart: {
      items: [
        {
          comicSlug: "neon-harbor-1",
          sku: "QCG-NH-001",
          title: "Neon Harbor: The Vanishing Beacon",
          contentLocale: "en",
          quantity: 2,
          unitPrice: {
            amountMinor: 1299,
            currencyCode: "USD",
          },
          lineTotal: {
            amountMinor: 2598,
            currencyCode: "USD",
          },
          stock: {
            quantity: 24,
            inStock: true,
          },
          coverPath: "media/comics/neon-harbor-1.png",
        },
      ],
      totalItems: 2,
      subtotal: {
        amountMinor: 2598,
        currencyCode: "USD",
      },
    },
  },
};
