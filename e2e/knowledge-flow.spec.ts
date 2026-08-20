import { expect, test } from '@playwright/test';

async function entrarComoAna(pagina: import('@playwright/test').Page) {
  await pagina.goto('/login');
  await pagina.getByRole('button', { name: 'Continuar com Keycloak' }).click();
  await pagina.locator('#username').fill('ana');
  await pagina.locator('#password').fill('context123');
  await pagina.locator('#kc-login').click();
  await expect(pagina).toHaveURL(/\/espacos/);
}

test('cria espaco, processa documento e responde com fonte', async ({ page }) => {
  test.setTimeout(90_000);
  await entrarComoAna(page);
  const nome = `Qualidade E2E ${Date.now()}`;

  await page.getByRole('button', { name: 'Novo espaco' }).click();
  await page.getByLabel('Nome').fill(nome);
  await page.getByLabel('Descricao').fill('Espaco criado pelo teste ponta a ponta do frontend.');
  await page.getByRole('button', { name: 'Criar espaco' }).click();

  await expect(page.getByRole('heading', { name: nome })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Documentos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Documentos' })).toBeVisible();
  await page.getByRole('button', { name: 'Enviar documento' }).first().click();
  await page.getByLabel('Arquivo').setInputFiles('e2e/fixtures/refund-policy.md');
  await page.getByLabel('Titulo').fill('Politica de reembolso E2E');
  await page.getByRole('button', { name: 'Enviar e verificar' }).click();
  const linhaDocumento = page.getByRole('row').filter({ hasText: 'Politica de reembolso E2E' });
  await expect(linhaDocumento).toContainText('PRONTO', { timeout: 30_000 });

  await page.getByRole('link', { name: 'Conversas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'O que voce precisa encontrar?' })).toBeVisible();
  await page.getByLabel('Mensagem para o assistente').fill('Qual e o prazo para solicitar reembolso?');
  await page.getByRole('button', { name: 'Enviar pergunta' }).click();
  await expect(page.getByText(/30 dias corridos/i)).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Ver fontes utilizadas' }).click();
  await expect(page.getByText('Politica de reembolso E2E')).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/chat-sources-desktop.png', fullPage: true });

  await page.getByRole('link', { name: 'Administracao', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Administracao' })).toBeVisible();
});
