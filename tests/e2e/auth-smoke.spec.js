import { expect, test } from "@playwright/test";

test("auth page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Note App" })).toBeVisible();
  await expect(page.getByText("Hesabım yok, kayıt ol")).toBeVisible();
});
