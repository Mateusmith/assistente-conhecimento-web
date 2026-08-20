import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClienteApi } from './api-client';

describe('ClienteApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('envia o token e serializa corpos JSON', async () => {
    const buscar = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 'espaco-1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', buscar);
    const cliente = new ClienteApi('http://api.local', async () => 'token-seguro');

    const resposta = await cliente.requisitar<{ id: string }>('/api/v1/espacos', {
      method: 'POST',
      corpo: { nome: 'Operacoes' },
    });

    expect(resposta.id).toBe('espaco-1');
    expect(buscar).toHaveBeenCalledWith(
      'http://api.local/api/v1/espacos',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ nome: 'Operacoes' }),
        headers: expect.any(Headers),
      }),
    );
    const cabecalhos = buscar.mock.calls[0]?.[1]?.headers as Headers;
    expect(cabecalhos.get('Authorization')).toBe('Bearer token-seguro');
    expect(cabecalhos.get('Content-Type')).toBe('application/json');
  });

  it('preserva o erro de negocio devolvido pelo backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ codigo: 'ACESSO_NEGADO', mensagem: 'Documento restrito.' }), {
          status: 403,
          statusText: 'Forbidden',
        }),
      ),
    );
    const cliente = new ClienteApi('http://api.local', async () => 'token-seguro');

    await expect(cliente.requisitar('/documentos')).rejects.toMatchObject({
      status: 403,
      codigo: 'ACESSO_NEGADO',
      message: 'Documento restrito.',
    });
  });

  it('interrompe chamadas autenticadas quando nao ha sessao', async () => {
    const buscar = vi.fn();
    vi.stubGlobal('fetch', buscar);
    const cliente = new ClienteApi('http://api.local', async () => null);

    await expect(cliente.requisitar('/protegido')).rejects.toMatchObject({ codigo: 'SESSAO_EXPIRADA' });
    expect(buscar).not.toHaveBeenCalled();
  });
});
