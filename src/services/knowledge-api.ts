import { ClienteApi } from '../lib/api-client';
import type {
  CasoAvaliacao,
  ComparacaoBusca,
  ConjuntoAvaliacao,
  ConversaDetalhe,
  ConversaResumo,
  Documento,
  Espaco,
  EventoAuditoria,
  ExclusaoPrivacidade,
  ExecucaoAvaliacao,
  FiltrosBusca,
  Governanca,
  IndiceEmbedding,
  InteracaoConversa,
  Membro,
  ModeloEmbedding,
  PapelMembro,
  RespostaRag,
  UsoEspaco,
  VisibilidadeDocumento,
} from '../types/api';

export interface DadosNovoDocumento {
  titulo: string;
  visibilidade: VisibilidadeDocumento;
  metadados?: Record<string, string>;
  arquivo: File;
}

export interface DadosNovoCaso {
  pergunta: string;
  termosEsperados: string[];
  documentosEsperados: string[];
  deveRecusar: boolean;
  latenciaMaximaMs?: number;
  custoMaximoUsd?: number;
}

export class ServicoConhecimento {
  constructor(private readonly cliente: ClienteApi) {}

  verificarSaude() {
    return this.cliente.requisitar<{ status: string }>('/actuator/health', { autenticada: false });
  }

  listarEspacos() {
    return this.cliente.requisitar<Espaco[]>('/api/v1/espacos');
  }

  criarEspaco(nome: string, descricao: string) {
    return this.cliente.requisitar<Espaco>('/api/v1/espacos', {
      method: 'POST',
      corpo: { nome, descricao: descricao || null },
    });
  }

  buscarEspaco(espacoId: string) {
    return this.cliente.requisitar<Espaco>(`/api/v1/espacos/${espacoId}`);
  }

  listarMembros(espacoId: string) {
    return this.cliente.requisitar<Membro[]>(`/api/v1/espacos/${espacoId}/membros`);
  }

  adicionarMembro(espacoId: string, usuarioId: string, papel: PapelMembro) {
    return this.cliente.requisitar<Membro>(`/api/v1/espacos/${espacoId}/membros`, {
      method: 'POST',
      corpo: { usuarioId, papel },
    });
  }

  listarDocumentos(espacoId: string) {
    return this.cliente.requisitar<Documento[]>(`/api/v1/espacos/${espacoId}/documentos`);
  }

  enviarDocumento(espacoId: string, dados: DadosNovoDocumento) {
    const formulario = new FormData();
    formulario.append('titulo', dados.titulo);
    formulario.append('visibilidade', dados.visibilidade);
    if (dados.metadados && Object.keys(dados.metadados).length > 0) {
      formulario.append('metadados', JSON.stringify(dados.metadados));
    }
    formulario.append('arquivo', dados.arquivo);
    return this.cliente.requisitar<Documento>(`/api/v1/espacos/${espacoId}/documentos`, {
      method: 'POST',
      corpo: formulario,
    });
  }

  baixarDocumento(espacoId: string, documentoId: string) {
    return this.cliente.baixar(`/api/v1/espacos/${espacoId}/documentos/${documentoId}/conteudo`);
  }

  reprocessarDocumento(espacoId: string, documentoId: string) {
    return this.cliente.requisitar<Documento>(
      `/api/v1/espacos/${espacoId}/documentos/${documentoId}/reprocessamento`,
      { method: 'POST' },
    );
  }

  concederPermissaoDocumento(espacoId: string, documentoId: string, usuarioId: string) {
    return this.cliente.requisitar<void>(
      `/api/v1/espacos/${espacoId}/documentos/${documentoId}/permissoes`,
      { method: 'POST', corpo: { usuarioId, nivel: 'LEITURA' } },
    );
  }

  listarConversas(espacoId: string, limite = 50) {
    return this.cliente.requisitar<ConversaResumo[]>(
      `/api/v1/espacos/${espacoId}/conversas?limite=${limite}`,
    );
  }

  criarConversa(espacoId: string, titulo: string) {
    return this.cliente.requisitar<ConversaResumo>(`/api/v1/espacos/${espacoId}/conversas`, {
      method: 'POST',
      corpo: { titulo: titulo || null },
    });
  }

  buscarConversa(espacoId: string, conversaId: string) {
    return this.cliente.requisitar<ConversaDetalhe>(
      `/api/v1/espacos/${espacoId}/conversas/${conversaId}`,
    );
  }

  atualizarConversa(espacoId: string, conversaId: string, titulo: string, estado: string) {
    return this.cliente.requisitar<ConversaResumo>(
      `/api/v1/espacos/${espacoId}/conversas/${conversaId}`,
      { method: 'PUT', corpo: { titulo, estado } },
    );
  }

  excluirConversa(espacoId: string, conversaId: string) {
    return this.cliente.requisitar<void>(`/api/v1/espacos/${espacoId}/conversas/${conversaId}`, {
      method: 'DELETE',
    });
  }

  listarConsultas(espacoId: string, limite = 100) {
    return this.cliente.requisitar<RespostaRag[]>(
      `/api/v1/espacos/${espacoId}/consultas?limite=${limite}`,
    );
  }

  registrarFeedback(espacoId: string, consultaId: string, util: boolean, comentario?: string) {
    return this.cliente.requisitar<void>(
      `/api/v1/espacos/${espacoId}/consultas/${consultaId}/feedback`,
      { method: 'POST', corpo: { util, comentario: comentario || null } },
    );
  }

  async enviarMensagemStreaming(
    espacoId: string,
    conversaId: string,
    pergunta: string,
    estrategia: string,
    filtros: FiltrosBusca = {},
  ): Promise<InteracaoConversa> {
    const resposta = await this.cliente.abrirFluxo(
      `/api/v1/espacos/${espacoId}/conversas/${conversaId}/mensagens/stream`,
      {
        method: 'POST',
        headers: { Accept: 'text/event-stream', 'Idempotency-Key': crypto.randomUUID() },
        corpo: { pergunta, estrategia, filtros },
      },
    );
    if (!resposta.body) throw new Error('O navegador nao disponibilizou o fluxo da resposta.');

    const leitor = resposta.body.getReader();
    const decodificador = new TextDecoder();
    let acumulado = '';
    let interacao: InteracaoConversa | null = null;

    while (true) {
      const { done, value } = await leitor.read();
      acumulado += decodificador.decode(value, { stream: !done });
      const eventos = acumulado.split(/\r?\n\r?\n/);
      acumulado = eventos.pop() ?? '';

      for (const bloco of eventos) {
        const linhas = bloco.split(/\r?\n/);
        const evento = linhas.find((linha) => linha.startsWith('event:'))?.slice(6).trim();
        const dados = linhas
          .filter((linha) => linha.startsWith('data:'))
          .map((linha) => linha.slice(5).trimStart())
          .join('\n');
        if (evento === 'erro') throw new Error('Nao foi possivel concluir a resposta da IA.');
        if (evento === 'resposta' && dados) interacao = JSON.parse(dados) as InteracaoConversa;
      }

      if (done) break;
    }

    if (!interacao) throw new Error('A resposta terminou sem uma interacao valida.');
    return interacao;
  }

  listarAvaliacoes(espacoId: string) {
    return this.cliente.requisitar<ConjuntoAvaliacao[]>(`/api/v1/espacos/${espacoId}/avaliacoes`);
  }

  criarAvaliacao(espacoId: string, nome: string, descricao: string) {
    return this.cliente.requisitar<ConjuntoAvaliacao>(`/api/v1/espacos/${espacoId}/avaliacoes`, {
      method: 'POST',
      corpo: { nome, descricao: descricao || null },
    });
  }

  listarCasos(espacoId: string, conjuntoId: string) {
    return this.cliente.requisitar<CasoAvaliacao[]>(
      `/api/v1/espacos/${espacoId}/avaliacoes/${conjuntoId}/casos`,
    );
  }

  adicionarCaso(espacoId: string, conjuntoId: string, dados: DadosNovoCaso) {
    return this.cliente.requisitar<CasoAvaliacao>(
      `/api/v1/espacos/${espacoId}/avaliacoes/${conjuntoId}/casos`,
      { method: 'POST', corpo: dados as unknown as Record<string, unknown> },
    );
  }

  listarExecucoes(espacoId: string, conjuntoId: string) {
    return this.cliente.requisitar<ExecucaoAvaliacao[]>(
      `/api/v1/espacos/${espacoId}/avaliacoes/${conjuntoId}/execucoes?limite=50`,
    );
  }

  executarAvaliacao(espacoId: string, conjuntoId: string, execucaoBaseId?: string) {
    return this.cliente.requisitar<ExecucaoAvaliacao>(
      `/api/v1/espacos/${espacoId}/avaliacoes/${conjuntoId}/execucoes`,
      { method: 'POST', corpo: execucaoBaseId ? { execucaoBaseId } : {} },
    );
  }

  cancelarAvaliacao(espacoId: string, conjuntoId: string, execucaoId: string) {
    return this.cliente.requisitar<ExecucaoAvaliacao>(
      `/api/v1/espacos/${espacoId}/avaliacoes/${conjuntoId}/execucoes/${execucaoId}`,
      { method: 'DELETE' },
    );
  }

  buscarGovernanca(espacoId: string) {
    return this.cliente.requisitar<Governanca>(`/api/v1/espacos/${espacoId}/governanca`);
  }

  atualizarGovernanca(espacoId: string, governanca: Governanca) {
    const dados = {
      limiteArmazenamentoBytes: governanca.limiteArmazenamentoBytes,
      limiteConsultasDia: governanca.limiteConsultasDia,
      limiteUploadsDia: governanca.limiteUploadsDia,
      retencaoConsultasDias: governanca.retencaoConsultasDias,
    };
    return this.cliente.requisitar<Governanca>(`/api/v1/espacos/${espacoId}/governanca`, {
      method: 'PUT',
      corpo: dados,
    });
  }

  consultarUso(espacoId: string) {
    return this.cliente.requisitar<UsoEspaco>(`/api/v1/espacos/${espacoId}/governanca/uso`);
  }

  listarIndices(espacoId: string) {
    return this.cliente.requisitar<IndiceEmbedding[]>(`/api/v1/espacos/${espacoId}/indices-embedding`);
  }

  listarModelos(espacoId: string) {
    return this.cliente.requisitar<ModeloEmbedding[]>(
      `/api/v1/espacos/${espacoId}/indices-embedding/modelos`,
    );
  }

  criarIndice(espacoId: string, modelo: string) {
    return this.cliente.requisitar<IndiceEmbedding>(`/api/v1/espacos/${espacoId}/indices-embedding`, {
      method: 'POST',
      corpo: { modelo },
    });
  }

  ativarIndice(espacoId: string, indiceId: string) {
    return this.cliente.requisitar<IndiceEmbedding>(
      `/api/v1/espacos/${espacoId}/indices-embedding/${indiceId}/ativacao`,
      { method: 'POST' },
    );
  }

  listarAuditoria(espacoId: string) {
    return this.cliente.requisitar<EventoAuditoria[]>(
      `/api/v1/espacos/${espacoId}/auditoria?limite=100`,
    );
  }

  compararBuscas(espacoId: string, pergunta: string, filtros: FiltrosBusca = {}) {
    return this.cliente.requisitar<ComparacaoBusca>(
      `/api/v1/espacos/${espacoId}/buscas/comparacoes`,
      { method: 'POST', corpo: { pergunta, filtros } },
    );
  }

  exportarPrivacidade() {
    return this.cliente.requisitar<Record<string, unknown>>('/api/v1/privacidade/exportacao');
  }

  excluirMeusDados() {
    return this.cliente.requisitar<ExclusaoPrivacidade>('/api/v1/privacidade/meus-dados', {
      method: 'DELETE',
    });
  }
}
