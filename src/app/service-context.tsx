import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';
import { useAutenticacao } from '../auth/auth-context';
import { ClienteApi } from '../lib/api-client';
import { configuracao } from '../lib/config';
import { ServicoConhecimento } from '../services/knowledge-api';

const ContextoServico = createContext<ServicoConhecimento | null>(null);

export function ProvedorServico({ children }: PropsWithChildren) {
  const { obterToken } = useAutenticacao();
  const servico = useMemo(
    () => new ServicoConhecimento(new ClienteApi(configuracao.apiUrl, obterToken)),
    [obterToken],
  );
  return <ContextoServico.Provider value={servico}>{children}</ContextoServico.Provider>;
}

export function useServico() {
  const servico = useContext(ContextoServico);
  if (!servico) throw new Error('useServico deve ser usado dentro do ProvedorServico.');
  return servico;
}
