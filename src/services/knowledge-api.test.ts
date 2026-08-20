import { describe, expect, it } from 'vitest';
import { ServicoConhecimento } from './knowledge-api';
import type { ClienteApi } from '../lib/api-client';

describe('ServicoConhecimento', () => {
  it('interpreta a resposta validada enviada por SSE', async () => {
    const interacao = {
      conversaId: 'conversa-1',
      versao: 2,
      mensagemUsuario: { id: 'm1' },
      mensagemAssistente: { id: 'm2' },
      resposta: { consultaId: 'c1', resposta: 'Prazo de 30 dias.', fontes: [] },
    };
    const fluxo = new ReadableStream({
      start(controlador) {
        const codificador = new TextEncoder();
        controlador.enqueue(codificador.encode('event: etapa\ndata: {"estado":"PROCESSANDO"}\n\n'));
        controlador.enqueue(codificador.encode(`event: resposta\ndata: ${JSON.stringify(interacao)}\n\n`));
        controlador.enqueue(codificador.encode('event: concluido\ndata: {"estado":"CONCLUIDO"}\n\n'));
        controlador.close();
      },
    });
    const cliente = {
      abrirFluxo: async () => new Response(fluxo, { status: 200 }),
    } as unknown as ClienteApi;
    const servico = new ServicoConhecimento(cliente);

    const resultado = await servico.enviarMensagemStreaming('e1', 'c1', 'Qual o prazo?', 'HIBRIDA');

    expect(resultado.resposta.resposta).toBe('Prazo de 30 dias.');
  });
});
