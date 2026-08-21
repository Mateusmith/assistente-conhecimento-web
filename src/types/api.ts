export type Identificador = string;
export type DataIso = string;

export type PapelMembro = 'PROPRIETARIO' | 'CURADOR' | 'LEITOR';

export interface Espaco {
  id: Identificador;
  nome: string;
  descricao: string | null;
  meuPapel: PapelMembro;
  criadoPor: string;
  criadoEm: DataIso;
}

export interface Membro {
  usuarioId: string;
  papel: PapelMembro;
  adicionadoPor: string;
  adicionadoEm: DataIso;
}

export type VisibilidadeDocumento = 'ESPACO' | 'RESTRITO';
export type EstadoDocumento = 'PENDENTE' | 'PROCESSANDO' | 'PRONTO' | 'FALHOU';
export type OrigemTexto = 'NATIVO' | 'OCR' | 'VISAO' | 'OCR_E_VISAO';

export interface Documento {
  id: Identificador;
  espacoId: Identificador;
  titulo: string;
  nomeArquivo: string;
  tipoMime: string;
  armazenamento: 'BANCO' | 'S3';
  resultadoAntivirus: 'NAO_VERIFICADO' | 'LIMPO';
  verificadoAntivirusEm: DataIso | null;
  origemTexto: OrigemTexto | null;
  paginasOcr: number;
  visaoAplicada: boolean;
  provedorVisao: string | null;
  modeloVisao: string | null;
  tokensVisaoEntrada: number;
  tokensVisaoSaida: number;
  custoVisaoUsd: number;
  metadados: Record<string, unknown> | null;
  visibilidade: VisibilidadeDocumento;
  estado: EstadoDocumento;
  versao: number;
  tamanhoBytes: number;
  criadoPor: string;
  criadoEm: DataIso;
  processadoEm: DataIso | null;
  erroProcessamento: string | null;
}

export type EstrategiaBusca = 'HIBRIDA' | 'SEMANTICA' | 'TEXTUAL';

export interface FiltrosBusca {
  documentos?: Identificador[];
  metadados?: Record<string, string>;
  tags?: string[];
  tipoMime?: string | null;
  criadoDe?: DataIso | null;
  criadoAte?: DataIso | null;
}

export interface FonteResposta {
  marcador: string;
  documentoId: Identificador;
  tituloDocumento: string;
  ordemTrecho: number;
  excerto: string;
  pontuacao: number;
}

export interface RespostaRag {
  consultaId: Identificador;
  pergunta: string;
  resposta: string;
  recusada: boolean;
  provedorIa: string;
  indiceEmbeddingId: Identificador | null;
  modeloEmbedding: string;
  estrategiaBusca: EstrategiaBusca;
  versaoPrompt: string;
  impressaoPrompt: string;
  candidatosRecuperados: number;
  fontesContexto: number;
  dadosSensiveisProtegidos: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoEstimadoUsd: number;
  latenciaMs: number;
  criadaEm: DataIso;
  fontes: FonteResposta[];
}

export type EstadoConversa = 'ATIVA' | 'ARQUIVADA';

export interface ConversaResumo {
  id: Identificador;
  espacoId: Identificador;
  titulo: string;
  estado: EstadoConversa;
  versao: number;
  quantidadeMensagens: number;
  criadaEm: DataIso;
  atualizadaEm: DataIso;
}

export interface MensagemConversa {
  id: Identificador;
  conversaId: Identificador;
  consultaId: Identificador | null;
  sequencia: number;
  papel: 'USUARIO' | 'ASSISTENTE';
  conteudo: string;
  criadaEm: DataIso;
}

export interface ConversaDetalhe {
  conversa: ConversaResumo;
  mensagens: MensagemConversa[];
}

export interface InteracaoConversa {
  conversaId: Identificador;
  versao: number;
  mensagemUsuario: MensagemConversa;
  mensagemAssistente: MensagemConversa;
  resposta: RespostaRag;
}

export interface ConjuntoAvaliacao {
  id: Identificador;
  espacoId: Identificador;
  nome: string;
  descricao: string | null;
  criadoPor: string;
  criadoEm: DataIso;
  quantidadeCasos: number;
}

export interface CasoAvaliacao {
  id: Identificador;
  conjuntoId: Identificador;
  pergunta: string;
  termosEsperados: string[];
  documentosEsperados: Identificador[];
  deveRecusar: boolean;
  latenciaMaximaMs: number | null;
  custoMaximoUsd: number | null;
}

export interface ResultadoCaso {
  casoId: Identificador;
  consultaId: Identificador | null;
  aprovado: boolean;
  pontuacaoTermos: number;
  pontuacaoFontes: number;
  precisaoFontes: number;
  mrr: number;
  recusaCorreta: boolean;
  latenciaMs: number;
  custoUsd: number;
  orcamentoRespeitado: boolean;
  detalhes: string;
}

export type EstadoExecucaoAvaliacao =
  | 'PENDENTE'
  | 'EXECUTANDO'
  | 'CONCLUIDA'
  | 'FALHOU'
  | 'CANCELADA';

export interface ExecucaoAvaliacao {
  id: Identificador;
  conjuntoId: Identificador;
  estado: EstadoExecucaoAvaliacao;
  erro: string | null;
  totalCasos: number;
  casosProcessados: number;
  casosAprovados: number;
  cancelamentoSolicitado: boolean;
  taxaAcerto: number;
  recallMedio: number;
  precisaoMedia: number;
  mrrMedio: number;
  latenciaP95Ms: number;
  custoTotalUsd: number;
  modeloEmbedding: string | null;
  provedorIa: string | null;
  execucaoBaseId: Identificador | null;
  iniciadaEm: DataIso | null;
  finalizadaEm: DataIso | null;
  ultimoLoteEm: DataIso | null;
  resultadosTruncados: boolean;
  resultados: ResultadoCaso[];
}

export interface Governanca {
  espacoId: Identificador;
  limiteArmazenamentoBytes: number;
  limiteConsultasDia: number;
  limiteUploadsDia: number;
  retencaoConsultasDias: number;
}

export interface ConsumoIa {
  data: string;
  provedor: string;
  modelo: string;
  operacao: string;
  chamadas: number;
  tokensEntrada: number;
  tokensSaida: number;
  custoEstimadoUsd: number;
}

export interface UsoEspaco {
  espacoId: Identificador;
  data: string;
  armazenamentoUsadoBytes: number;
  limiteArmazenamentoBytes: number;
  consultasHoje: number;
  limiteConsultasDia: number;
  uploadsHoje: number;
  limiteUploadsDia: number;
  tokensEntradaUltimos30Dias: number;
  tokensSaidaUltimos30Dias: number;
  custoEstimadoUsdUltimos30Dias: number;
  consumoIa: ConsumoIa[];
}

export interface IndiceEmbedding {
  id: Identificador;
  espacoId: Identificador;
  provedor: string;
  modelo: string;
  dimensoes: number;
  estado: 'ATIVO' | 'CONSTRUINDO' | 'ARQUIVADO' | 'FALHOU';
  totalTrechos: number;
  trechosProcessados: number;
  progressoPercentual: number;
  tentativas: number;
  criadoPor: string;
  criadoEm: DataIso;
  iniciadoEm: DataIso | null;
  finalizadoEm: DataIso | null;
  ativadoEm: DataIso | null;
  erro: string | null;
}

export interface ModeloEmbedding {
  modelo: string;
  provedor: string;
  dimensoes: number;
}

export interface EventoAuditoria {
  id: Identificador;
  usuarioId: string;
  acao: string;
  recurso: string;
  recursoId: string;
  detalhes: string;
  criadoEm: DataIso;
}

export interface FonteRecuperada {
  trechoId: Identificador;
  documentoId: Identificador;
  tituloDocumento: string;
  ordemTrecho: number;
  conteudo: string;
  pontuacaoSemantica: number;
  pontuacaoTextual: number;
  pontuacao: number;
}

export interface ComparacaoBusca {
  indiceId: Identificador;
  modeloEmbedding: string;
  resultados: Array<{
    estrategia: EstrategiaBusca;
    fontes: FonteRecuperada[];
  }>;
  sobreposicaoSemanticaTextual: number;
}

export interface ExclusaoPrivacidade {
  estado: string;
  identificadorPseudonimo: string;
  consultasExcluidas: number;
  conversasExcluidas: number;
  vinculosExcluidos: number;
  concluidaEm: DataIso;
}

export interface ErroApiResposta {
  instante?: DataIso;
  status?: number;
  codigo?: string;
  mensagem?: string;
  caminho?: string;
  campos?: Array<{ campo: string; mensagem: string }>;
}
