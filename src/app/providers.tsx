import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type PropsWithChildren } from 'react';
import { ProvedorAutenticacao } from '../auth/auth-context';
import { ProvedorNotificacao } from '../components/ui/notification';

export function Provedores({ children }: PropsWithChildren) {
  const [clienteConsulta] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            retry: (tentativas, erro) => {
              const status = (erro as { status?: number }).status;
              return status !== 401 && status !== 403 && tentativas < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: { retry: false },
        },
      }),
  );

  return (
    <ProvedorAutenticacao>
      <QueryClientProvider client={clienteConsulta}>
        <ProvedorNotificacao>{children}</ProvedorNotificacao>
      </QueryClientProvider>
    </ProvedorAutenticacao>
  );
}
