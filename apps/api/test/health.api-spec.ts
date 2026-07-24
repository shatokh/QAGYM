import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("GET /health", () => {
  let app: INestApplication | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it("returns the platform health contract", async () => {
    if (!app) {
      throw new Error("Test application was not initialized.");
    }

    await request(app.getHttpServer())
      .get("/health")
      .expect("Content-Type", /json/)
      .expect(200)
      .expect({ status: "ok" });
  });
});
