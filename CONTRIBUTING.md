# Contribuição

## Preparação

1. Use Node.js 22.12 ou superior.
2. Copie `.env.example` para `.env`.
3. Execute `npm install`.
4. Mantenha o back-end local disponível para os testes ponta a ponta.

## Antes de enviar uma alteração

```powershell
npm run check
npm run test:e2e
```

Prefira mudanças pequenas, nomes de código em português e nomes de arquivos e pastas em inglês. Uma funcionalidade deve incluir os estados de carregamento, vazio, erro e sucesso relevantes, além de testes proporcionais ao risco.

Commits seguem o formato Conventional Commits, por exemplo: `feat: adiciona filtro de documentos` ou `fix: preserva conversa ao trocar de espaço`.
