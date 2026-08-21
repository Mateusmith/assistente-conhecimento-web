import type { PropsWithChildren } from 'react';

interface PropriedadesStatus extends PropsWithChildren {
  tom?: 'neutro' | 'sucesso' | 'aviso' | 'erro' | 'informacao';
}

export function Status({ tom = 'neutro', children }: PropriedadesStatus) {
  return <span className={`status-badge status-${tom}`}>{children}</span>;
}

export function tomDoEstado(estado: string): PropriedadesStatus['tom'] {
  if (['PRONTO', 'ATIVO', 'CONCLUIDO', 'CONCLUIDA', 'LIMPO', 'APROVADO'].includes(estado)) return 'sucesso';
  if (['PENDENTE', 'PROCESSANDO', 'CONSTRUINDO', 'AGENDADA', 'EM_EXECUCAO', 'EXECUTANDO'].includes(estado)) return 'aviso';
  if (['FALHOU', 'CANCELADA', 'REPROVADO'].includes(estado)) return 'erro';
  if (['RESTRITO', 'CURADOR'].includes(estado)) return 'informacao';
  return 'neutro';
}
