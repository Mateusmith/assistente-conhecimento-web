import { describe, expect, it } from 'vitest';
import { execucaoEstaAtiva, execucaoEstaConcluida } from './evaluation-state';

describe('estado da execucao de avaliacao', () => {
  it.each(['PENDENTE', 'EXECUTANDO'] as const)('mantem polling para %s', (estado) => {
    expect(execucaoEstaAtiva(estado)).toBe(true);
  });

  it.each(['CONCLUIDA', 'FALHOU', 'CANCELADA'] as const)('encerra polling para %s', (estado) => {
    expect(execucaoEstaAtiva(estado)).toBe(false);
  });

  it('aceita somente execucao concluida como baseline', () => {
    expect(execucaoEstaConcluida('CONCLUIDA')).toBe(true);
    expect(execucaoEstaConcluida('EXECUTANDO')).toBe(false);
  });
});
