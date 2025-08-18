import {expect, test} from '@playwright/test';

const url = "/index.html"

test('get route', async ({ page }) => {

  const from = "Freiburgstrasse 251, 3018 Bern";
  const to = "Belpstrasse 37, 3008 Bern";

  await page.goto('http://localhost:3000/');

  await page.getByLabel(/Start:?/i).fill(from); // akzeptiert Start oder Start:
  await page.getByLabel(/End:?/i).fill(to);

  await page.getByRole('button', { name: /Absenden/i }).click();

  await expect(page.getByText("Freiburgstrasse")).toBeVisible();
  await expect(page.getByText("Schlossstrasse")).toBeVisible();
  await expect(page.getByText("Belpstrasse")).toBeVisible();
});