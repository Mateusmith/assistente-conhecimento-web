# Changelog

Todas as mudancas relevantes deste projeto sao registradas neste arquivo.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.1] - 2026-08-20

### Corrigido

- Estados de avaliacao foram alinhados ao contrato real da API.
- Execucoes `PENDENTE` e `EXECUTANDO` agora mantem a atualizacao automatica.
- Execucoes `CONCLUIDA` voltaram a aparecer como baseline e com status de sucesso.
- Testes visuais nao sobrescrevem mais as imagens estaveis da documentacao.

## [1.0.0] - 2026-08-20

### Adicionado

- Interface React e TypeScript para documentos, conversas RAG, avaliacoes e administracao.
- Autenticacao OAuth2/OIDC com Authorization Code e PKCE.
- Testes unitarios, Playwright responsivo, imagem Docker e Nginx sem privilegios.
