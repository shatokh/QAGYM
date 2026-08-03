import { expect, test } from "@playwright/test";

test.describe("clean auth UI browser smoke", () => {
  test("keeps the English catalog public and supports user login/logout", async ({
    page,
  }) => {
    await page.goto("/en/comics");

    await expect(page.getByTestId("catalog-grid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();

    await page.getByRole("link", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    await page.getByLabel("Email").fill("user@qacomics.local");
    await page.getByLabel("Password").fill("DemoUserPassphrase2026!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/comics$/);
    await expect(page.getByText("Signed in as Demo User")).toBeVisible();
    await expect(page.getByText("User", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
    await expect(page.getByTestId("catalog-grid")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("shows admin role state after admin login", async ({ page }) => {
    await page.goto("/en/login");

    await page.getByLabel("Email").fill("admin@qacomics.local");
    await page.getByLabel("Password").fill("DemoAdminPassphrase2026!");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/en\/comics$/);
    await expect(page.getByText("Signed in as Demo Admin")).toBeVisible();
    await expect(page.getByText("Admin", { exact: true })).toBeVisible();
  });

  test("shows generic invalid-credentials UI without account-existence details", async ({
    page,
  }) => {
    await page.goto("/en/login");

    await page.getByLabel("Email").fill("unknown@qacomics.local");
    await page.getByLabel("Password").fill("not-the-demo-password");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByRole("alert")).toContainText(
      "Invalid email or password.",
    );
    await expect(page.getByRole("alert")).not.toContainText("unknown");
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("supports localized Russian login and catalog navigation", async ({
    page,
  }) => {
    await page.goto("/ru/login");

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("heading", { name: "Вход" })).toBeVisible();

    await page.getByLabel("Email").fill("user@qacomics.local");
    await page.getByLabel("Пароль").fill("DemoUserPassphrase2026!");
    await page.getByRole("button", { name: "Войти" }).click();

    await expect(page).toHaveURL(/\/ru\/comics$/);
    await expect(
      page.getByRole("heading", { name: "Каталог комиксов" }),
    ).toBeVisible();
    await expect(page.getByText("Вход: Demo User")).toBeVisible();
    await expect(page.getByText("Пользователь")).toBeVisible();
  });
});
