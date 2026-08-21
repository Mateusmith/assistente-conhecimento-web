import type { EstadoExecucaoAvaliacao } from '../../types/api';

const estadosAtivos = new Set<EstadoExecucaoAvaliacao>(['PENDENTE', 'EXECUTANDO']);

export function execucaoEstaAtiva(estado: EstadoExecucaoAvaliacao) {
  return estadosAtivos.has(estado);
}

export function execucaoEstaConcluida(estado: EstadoExecucaoAvaliacao) {
  return estado === 'CONCLUIDA';
}
