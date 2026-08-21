import { expect, test } from '@playwright/test';

test('tela de acesso permanece legivel em celular', async ({ page }, testInfo) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Assistente de Conhecimento' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Continuar com Keycloak' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
  await page.screenshot({ path: testInfo.outputPath(`login-${testInfo.project.name}.png`), fullPage: true });
});
