import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Clipboard,
  FileSearch,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { Botao } from '../../components/ui/button';
import { useNotificacao } from '../../components/ui/notification';
import { Status } from '../../components/ui/status-badge';
import { mensagemDeErro } from '../../lib/api-client';
import { formatarData, formatarPercentual, limitarTexto } from '../../lib/formatters';
import type { EstrategiaBusca, MensagemConversa, RespostaRag } from '../../types/api';

const sugestoes = [
  'Qual e o prazo para solicitar reembolso?',
  'Resuma as politicas mais importantes deste espaco.',
  'Quais documentos tratam de seguranca da informacao?',
];

export function PaginaConversas() {
  const { espacoId = '', conversaId } = useParams();
  const navegar = useNavigate();
  const servico = useServico();
  const clienteConsulta = useQueryClient();
  const { notificar } = useNotificacao();
  const [pergunta, definirPergunta] = useState('');
  const [estrategia, definirEstrategia] = useState<EstrategiaBusca>('HIBRIDA');
  const [enviando, definirEnviando] = useState(false);
  const [perguntaPendente, definirPerguntaPendente] = useState<string | null>(null);
  const [respostaRecente, definirRespostaRecente] = useState<RespostaRag | null>(null);
  const [fontesAbertas, definirFontesAbertas] = useState<Set<string>>(new Set());
  const [listaVisivel, definirListaVisivel] = useState(true);
  const [copiado, definirCopiado] = useState<string | null>(null);

  const conversas = useQuery({
    queryKey: ['conversas', espacoId],
    queryFn: () => servico.listarConversas(espacoId),
  });
  const detalhe = useQuery({
    queryKey: ['conversa', espacoId, conversaId],
    queryFn: () => servico.buscarConversa(espacoId, conversaId!),
    enabled: Boolean(conversaId),
  });
  const consultas = useQuery({
    queryKey: ['consultas', espacoId],
    queryFn: () => servico.listarConsultas(espacoId),
  });

  const respostasPorConsulta = useMemo(() => {
    const mapa = new Map<string, RespostaRag>();
    consultas.data?.forEach((item) => mapa.set(item.consultaId, item));
    if (respostaRecente) mapa.set(respostaRecente.consultaId, respostaRecente);
    return mapa;
  }, [consultas.data, respostaRecente]);

  const excluir = useMutation({
    mutationFn: (id: string) => servico.excluirConversa(espacoId, id),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['conversas', espacoId] });
      notificar('Conversa excluida.', 'sucesso');
      navegar(`/espacos/${espacoId}/conversas`);
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const arquivar = useMutation({
    mutationFn: () => {
      if (!conversaId || !detalhe.data) throw new Error('Conversa nao selecionada.');
      return servico.atualizarConversa(espacoId, conversaId, detalhe.data.conversa.titulo, 'ARQUIVADA');
    },
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['conversas', espacoId] });
      await clienteConsulta.invalidateQueries({ queryKey: ['conversa', espacoId, conversaId] });
      notificar('Conversa arquivada.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const feedback = useMutation({
    mutationFn: ({ consultaId, util }: { consultaId: string; util: boolean }) =>
      servico.registrarFeedback(espacoId, consultaId, util),
    onSuccess: () => notificar('Obrigado pelo feedback.', 'sucesso'),
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  async function enviar(textoRecebido?: string) {
    const texto = (textoRecebido ?? pergunta).trim();
    if (!texto || enviando) return;
    definirEnviando(true);
    definirPerguntaPendente(texto);
    definirPergunta('');
    definirRespostaRecente(null);

    try {
      let idAtual = conversaId;
      if (!idAtual) {
        const criada = await servico.criarConversa(espacoId, limitarTexto(texto, 90));
        idAtual = criada.id;
        navegar(`/espacos/${espacoId}/conversas/${criada.id}`, { replace: true });
      }
      const interacao = await servico.enviarMensagemStreaming(espacoId, idAtual, texto, estrategia);
      definirRespostaRecente(interacao.resposta);
      await Promise.all([
        clienteConsulta.invalidateQueries({ queryKey: ['conversa', espacoId, idAtual] }),
        clienteConsulta.invalidateQueries({ queryKey: ['conversas', espacoId] }),
        clienteConsulta.invalidateQueries({ queryKey: ['consultas', espacoId] }),
        clienteConsulta.invalidateQueries({ queryKey: ['uso', espacoId] }),
      ]);
    } catch (erro) {
      definirPergunta(texto);
      notificar(mensagemDeErro(erro), 'erro');
    } finally {
      definirPerguntaPendente(null);
      definirEnviando(false);
    }
  }

  function aoPressionar(evento: KeyboardEvent<HTMLTextAreaElement>) {
    if (evento.key === 'Enter' && !evento.shiftKey) {
      evento.preventDefault();
      void enviar();
    }
  }

  async function copiar(conteudo: string, id: string) {
    await navigator.clipboard.writeText(conteudo);
    definirCopiado(id);
    window.setTimeout(() => definirCopiado(null), 1800);
  }

  function alternarFontes(id: string) {
    definirFontesAbertas((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(id)) proximas.delete(id); else proximas.add(id);
      return proximas;
    });
  }

  const mensagens = detalhe.data?.mensagens ?? [];

  return (
    <div className={`chat-layout ${listaVisivel ? '' : 'conversation-list-collapsed'}`}>
      <aside className="conversation-list" aria-label="Historico de conversas">
        <div className="conversation-list-header">
          <h2>Conversas</h2>
          <button className="icon-button" type="button" onClick={() => navegar(`/espacos/${espacoId}/conversas`)} aria-label="Nova conversa" title="Nova conversa"><MessageSquarePlus size={18} aria-hidden="true" /></button>
        </div>
        <div className="conversation-list-scroll">
          {conversas.data?.map((conversa) => (
            <button
              className={`conversation-list-item ${conversa.id === conversaId ? 'active' : ''}`}
              type="button"
              key={conversa.id}
              onClick={() => navegar(`/espacos/${espacoId}/conversas/${conversa.id}`)}
            >
              <span>{limitarTexto(conversa.titulo, 54)}</span>
              <small>{conversa.quantidadeMensagens} mensagens · {formatarData(conversa.atualizadaEm)}</small>
            </button>
          ))}
          {!conversas.isLoading && conversas.data?.length === 0 && <p className="conversation-list-empty">Nenhuma conversa iniciada.</p>}
        </div>
      </aside>

      <section className="chat-panel">
        <header className="chat-header">
          <button className="icon-button" type="button" onClick={() => definirListaVisivel((visivel) => !visivel)} aria-label={listaVisivel ? 'Ocultar conversas' : 'Mostrar conversas'} title={listaVisivel ? 'Ocultar conversas' : 'Mostrar conversas'}>
            {listaVisivel ? <PanelLeftClose size={18} aria-hidden="true" /> : <PanelLeftOpen size={18} aria-hidden="true" />}
          </button>
          <div className="chat-title">
            <strong>{detalhe.data?.conversa.titulo ?? 'Nova conversa'}</strong>
            <span>{detalhe.data?.conversa.estado === 'ARQUIVADA' ? 'Somente leitura' : 'Respostas com fontes autorizadas'}</span>
          </div>
          {conversaId && detalhe.data && (
            <div className="chat-actions">
              <button className="icon-button" type="button" onClick={() => arquivar.mutate()} aria-label="Arquivar conversa" title="Arquivar"><Archive size={17} aria-hidden="true" /></button>
              <button className="icon-button danger-icon" type="button" onClick={() => {
                if (window.confirm('Excluir esta conversa permanentemente?')) excluir.mutate(conversaId);
              }} aria-label="Excluir conversa" title="Excluir"><Trash2 size={17} aria-hidden="true" /></button>
            </div>
          )}
        </header>

        <div className="message-scroll" aria-live="polite">
          {!conversaId && mensagens.length === 0 && (
            <div className="chat-welcome">
              <span><Sparkles size={25} aria-hidden="true" /></span>
              <h1>O que voce precisa encontrar?</h1>
              <p>As respostas usam apenas documentos que sua conta pode acessar.</p>
              <div className="suggestion-list">
                {sugestoes.map((sugestao) => <button type="button" key={sugestao} onClick={() => void enviar(sugestao)}>{sugestao}<ChevronRight size={16} aria-hidden="true" /></button>)}
              </div>
            </div>
          )}

          {detalhe.isLoading && <div className="loading-block"><span /><span /><span /></div>}
          {detalhe.isError && <div className="error-banner"><strong>Nao foi possivel abrir esta conversa.</strong><button type="button" onClick={() => void detalhe.refetch()}>Tentar novamente</button></div>}

          <div className="message-list">
            {mensagens.map((mensagem) => (
              <Mensagem
                key={mensagem.id}
                mensagem={mensagem}
                resposta={mensagem.consultaId ? respostasPorConsulta.get(mensagem.consultaId) : undefined}
                fontesAbertas={mensagem.consultaId ? fontesAbertas.has(mensagem.consultaId) : false}
                aoAlternarFontes={alternarFontes}
                aoCopiar={copiar}
                copiado={copiado === mensagem.id}
                aoAvaliar={(util) => mensagem.consultaId && feedback.mutate({ consultaId: mensagem.consultaId, util })}
              />
            ))}
            {perguntaPendente && (
              <>
                <div className="message message-user"><span className="message-avatar"><UserRound size={17} aria-hidden="true" /></span><div className="message-body"><p>{perguntaPendente}</p></div></div>
                <div className="message message-assistant pending"><span className="message-avatar"><Bot size={17} aria-hidden="true" /></span><div className="message-body"><div className="thinking"><span /><span /><span /></div><small>Consultando fontes autorizadas</small></div></div>
              </>
            )}
          </div>
        </div>

        <footer className="chat-composer">
          <div className="composer-options">
            <label>Busca
              <select value={estrategia} onChange={(evento) => definirEstrategia(evento.target.value as EstrategiaBusca)} disabled={enviando}>
                <option value="HIBRIDA">Hibrida</option><option value="SEMANTICA">Semantica</option><option value="TEXTUAL">Textual</option>
              </select>
            </label>
            <span><FileSearch size={14} aria-hidden="true" /> fontes obrigatorias</span>
          </div>
          <div className="composer-box">
            <textarea value={pergunta} onChange={(evento) => definirPergunta(evento.target.value)} onKeyDown={aoPressionar} maxLength={2000} rows={2} placeholder="Pergunte sobre os documentos deste espaco" disabled={enviando || detalhe.data?.conversa.estado === 'ARQUIVADA'} aria-label="Mensagem para o assistente" />
            <Botao variante="primario" icone={Send} onClick={() => void enviar()} carregando={enviando} disabled={!pergunta.trim()} aria-label="Enviar pergunta">Enviar</Botao>
          </div>
          <small className="composer-disclaimer">Confira as fontes antes de tomar decisoes importantes.</small>
        </footer>
      </section>
    </div>
  );
}

interface PropriedadesMensagem {
  mensagem: MensagemConversa;
  resposta?: RespostaRag;
  fontesAbertas: boolean;
  aoAlternarFontes: (id: string) => void;
  aoCopiar: (conteudo: string, id: string) => Promise<void>;
  copiado: boolean;
  aoAvaliar: (util: boolean) => void;
}

function Mensagem({ mensagem, resposta, fontesAbertas, aoAlternarFontes, aoCopiar, copiado, aoAvaliar }: PropriedadesMensagem) {
  const assistente = mensagem.papel === 'ASSISTENTE';
  const marcador = resposta?.consultaId ?? mensagem.id;
  return (
    <div className={`message ${assistente ? 'message-assistant' : 'message-user'}`}>
      <span className="message-avatar">{assistente ? <Bot size={17} aria-hidden="true" /> : <UserRound size={17} aria-hidden="true" />}</span>
      <div className="message-body">
        <div className="message-meta"><strong>{assistente ? 'Assistente' : 'Voce'}</strong><time>{formatarData(mensagem.criadaEm)}</time></div>
        <p>{mensagem.conteudo}</p>
        {assistente && resposta && (
          <>
            <div className="answer-metadata">
              <Status tom={resposta.recusada ? 'aviso' : 'sucesso'}>{resposta.recusada ? 'RECUSADA COM SEGURANCA' : `${resposta.fontes.length} FONTES`}</Status>
              <span>{resposta.modeloEmbedding}</span><span>{resposta.latenciaMs} ms</span>
            </div>
            {resposta.fontes.length > 0 && (
              <div className="source-section">
                <button className="source-toggle" type="button" onClick={() => aoAlternarFontes(marcador)}>
                  {fontesAbertas ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
                  Ver fontes utilizadas
                </button>
                {fontesAbertas && <div className="source-list">{resposta.fontes.map((fonte) => (
                  <article key={`${fonte.documentoId}-${fonte.ordemTrecho}`}>
                    <header><span>{fonte.marcador}</span><strong>{fonte.tituloDocumento}</strong><small>{formatarPercentual(fonte.pontuacao)} relevancia</small></header>
                    <p>{fonte.excerto}</p>
                  </article>
                ))}</div>}
              </div>
            )}
            <div className="message-tools">
              <button className="icon-button" type="button" onClick={() => void aoCopiar(mensagem.conteudo, mensagem.id)} aria-label="Copiar resposta" title="Copiar">{copiado ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}</button>
              <button className="icon-button" type="button" onClick={() => aoAvaliar(true)} aria-label="Resposta util" title="Util"><ThumbsUp size={16} aria-hidden="true" /></button>
              <button className="icon-button" type="button" onClick={() => aoAvaliar(false)} aria-label="Resposta nao util" title="Nao util"><ThumbsDown size={16} aria-hidden="true" /></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
