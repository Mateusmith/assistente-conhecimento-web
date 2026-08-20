# Arquitetura do front-end

## Objetivo

Oferecer uma interface operacional para a API Assistente de Conhecimento sem duplicar regras de autorização que pertencem ao back-end. O navegador apresenta capacidades, coleta comandos e mantém o contexto de navegação; a API continua sendo a fonte de verdade.

## Decisões principais

### Organização por funcionalidade

Cada domínio de interface vive em `src/features`: espaços, documentos, conversa, avaliações, administração e privacidade. Isso mantém página, componentes e regras de apresentação próximos e evita uma separação técnica excessiva.

### Contratos HTTP centralizados

`src/services/knowledge-api.ts` representa as operações do back-end. `src/lib/api-client.ts` adiciona o token, normaliza erros e trata respostas sem espalhar `fetch` pelas páginas.

### Estado remoto separado do estado visual

TanStack Query controla cache, invalidação, repetição e carregamento dos dados remotos. Estado local do React fica restrito a formulários, modais, filtros e seleção visual.

### Autenticação sem segredo no navegador

O cliente usa OAuth2/OIDC Authorization Code com PKCE. O Keycloak emite o token e a API valida emissor, audiência, usuário e permissões. Nenhum `client_secret` é distribuído com a aplicação.

### Streaming validado

O chat consome Server-Sent Events autenticado pela camada de serviço. A interface exibe a resposta final e as fontes aceitas pela API, preservando a política do back-end de não entregar tokens ainda não validados.

## Limites de confiança

- o front-end pode ocultar ações por ergonomia, mas não concede autorização;
- identificadores recebidos da URL ou do navegador são sempre revalidados pela API;
- tokens permanecem em `sessionStorage` e expiram com a sessão;
- conteúdo documental é renderizado como texto, sem executar HTML retornado;
- variáveis `VITE_*` são configuração pública, nunca segredos.

## Testes

- testes unitários validam contratos, componentes e transformação de erros;
- Playwright comprova jornadas reais contra API, Keycloak, PostgreSQL, MinIO e trabalhadores de ingestão;
- capturas em desktop e mobile verificam enquadramento, responsividade e ausência de sobreposição;
- o build TypeScript impede contratos inconsistentes de seguirem para produção.
