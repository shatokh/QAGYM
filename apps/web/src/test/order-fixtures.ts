import type {
  OrderDetailResponse,
  OrderListResponse,
} from "../features/checkout/api/checkout.contract";

export const orderDetailResponseFixture: OrderDetailResponse = {
  data: {
    order: {
      orderNumber: "QCG-20260803-0001",
      status: "PLACED",
      createdAt: "2026-08-03T12:00:00.000Z",
      totalItems: 2,
      total: {
        amountMinor: 2598,
        currencyCode: "USD",
      },
      address: {
        recipientName: "Demo User",
        addressLine1: "101 Test Loop",
        addressLine2: "Suite QA",
        city: "Testville",
        region: "CA",
        postalCode: "90001",
        countryCode: "US",
      },
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
        },
      ],
    },
  },
};

export const emptyOrderListResponseFixture: OrderListResponse = {
  data: [],
  pagination: {
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  },
};

export const populatedOrderListResponseFixture: OrderListResponse = {
  data: [
    {
      orderNumber: orderDetailResponseFixture.data.order.orderNumber,
      status: orderDetailResponseFixture.data.order.status,
      createdAt: orderDetailResponseFixture.data.order.createdAt,
      totalItems: orderDetailResponseFixture.data.order.totalItems,
      total: orderDetailResponseFixture.data.order.total,
    },
  ],
  pagination: {
    page: 1,
    pageSize: 12,
    totalItems: 1,
    totalPages: 1,
  },
};
