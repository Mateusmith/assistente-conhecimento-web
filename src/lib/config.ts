import { z } from 'zod';

const esquemaConfiguracao = z.object({
  apiUrl: z.string().url(),
  autoridadeOidc: z.string().url(),
  clienteOidc: z.string().min(1),
  escopoOidc: z.string().min(1),
});

export const configuracao = esquemaConfiguracao.parse({
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:8083',
  autoridadeOidc:
    import.meta.env.VITE_OIDC_AUTHORITY ?? 'http://localhost:18084/realms/contextpilot',
  clienteOidc: import.meta.env.VITE_OIDC_CLIENT_ID ?? 'contextpilot-web',
  escopoOidc: import.meta.env.VITE_OIDC_SCOPE ?? 'openid profile email',
});
