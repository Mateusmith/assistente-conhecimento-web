import { describe, expect, it } from 'vitest';
import { formatarBytes, formatarPercentual, iniciais, limitarTexto } from './formatters';

describe('formatadores', () => {
  it('apresenta bytes usando a unidade adequada', () => {
    expect(formatarBytes(0)).toBe('0 B');
    expect(formatarBytes(1024)).toBe('1 KB');
    expect(formatarBytes(1_572_864)).toBe('1,5 MB');
  });

  it('converte fracoes em percentual', () => {
    expect(formatarPercentual(0.875)).toBe('87,5%');
  });

  it('gera iniciais estaveis para o avatar', () => {
    expect(iniciais('Ana Administradora')).toBe('AA');
    expect(iniciais('Carla')).toBe('C');
  });

  it('limita textos sem ultrapassar o tamanho pedido', () => {
    expect(limitarTexto('Politica corporativa de reembolso', 18)).toBe('Politica corporat…');
    expect(limitarTexto('Curto', 18)).toBe('Curto');
  });
});
