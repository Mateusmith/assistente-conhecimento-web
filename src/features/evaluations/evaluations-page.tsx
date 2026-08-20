import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Beaker,
  CircleStop,
  Clock3,
  DollarSign,
  Gauge,
  ListChecks,
  Play,
  Plus,
  Target,
} from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { Botao } from '../../components/ui/button';
import { EstadoVazio } from '../../components/ui/empty-state';
import { Modal } from '../../components/ui/modal';
import { useNotificacao } from '../../components/ui/notification';
import { Status, tomDoEstado } from '../../components/ui/status-badge';
import { mensagemDeErro } from '../../lib/api-client';
import { formatarData, formatarMoedaUsd, formatarPercentual } from '../../lib/formatters';

export function PaginaAvaliacoes() {
  const { espacoId = '' } = useParams();
  const servico = useServico();
  const clienteConsulta = useQueryClient();
  const { notificar } = useNotificacao();
  const [conjuntoEscolhidoId, definirConjuntoId] = useState<string | null>(null);
  const [execucaoSelecionada, definirExecucaoSelecionada] = useState<string | null>(null);
  const [modalConjunto, definirModalConjunto] = useState(false);
  const [modalCaso, definirModalCaso] = useState(false);
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');
  const [pergunta, definirPergunta] = useState('');
  const [termos, definirTermos] = useState('');
  const [deveRecusar, definirDeveRecusar] = useState(false);
  const [baselineId, definirBaselineId] = useState('');

  const conjuntos = useQuery({
    queryKey: ['avaliacoes', espacoId],
    queryFn: () => servico.listarAvaliacoes(espacoId),
  });
  const conjuntoId = conjuntoEscolhidoId ?? conjuntos.data?.[0]?.id ?? null;

  const casos = useQuery({
    queryKey: ['casos-avaliacao', espacoId, conjuntoId],
    queryFn: () => servico.listarCasos(espacoId, conjuntoId!),
    enabled: Boolean(conjuntoId),
  });
  const execucoes = useQuery({
    queryKey: ['execucoes-avaliacao', espacoId, conjuntoId],
    queryFn: () => servico.listarExecucoes(espacoId, conjuntoId!),
    enabled: Boolean(conjuntoId),
    refetchInterval: (consulta) =>
      consulta.state.data?.some((execucao) => ['AGENDADA', 'EM_EXECUCAO', 'PROCESSANDO'].includes(execucao.estado))
        ? 2000
        : false,
  });

  const execucaoAtual = useMemo(
    () => execucoes.data?.find((execucao) => execucao.id === execucaoSelecionada) ?? execucoes.data?.[0],
    [execucaoSelecionada, execucoes.data],
  );

  const criarConjunto = useMutation({
    mutationFn: () => servico.criarAvaliacao(espacoId, nome.trim(), descricao.trim()),
    onSuccess: async (criado) => {
      await clienteConsulta.invalidateQueries({ queryKey: ['avaliacoes', espacoId] });
      definirConjuntoId(criado.id);
      definirModalConjunto(false);
      definirNome('');
      definirDescricao('');
      notificar('Conjunto de avaliacao criado.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const adicionarCaso = useMutation({
    mutationFn: () => servico.adicionarCaso(espacoId, conjuntoId!, {
      pergunta: pergunta.trim(),
      termosEsperados: termos.split(',').map((termo) => termo.trim()).filter(Boolean),
      documentosEsperados: [],
      deveRecusar,
      latenciaMaximaMs: 5000,
      custoMaximoUsd: 0.1,
    }),
    onSuccess: async () => {
      await Promise.all([
        clienteConsulta.invalidateQueries({ queryKey: ['casos-avaliacao', espacoId, conjuntoId] }),
        clienteConsulta.invalidateQueries({ queryKey: ['avaliacoes', espacoId] }),
      ]);
      definirModalCaso(false);
      definirPergunta('');
      definirTermos('');
      definirDeveRecusar(false);
      notificar('Caso adicionado ao conjunto.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const executar = useMutation({
    mutationFn: () => servico.executarAvaliacao(espacoId, conjuntoId!, baselineId || undefined),
    onSuccess: async (execucao) => {
      definirExecucaoSelecionada(execucao.id);
      await clienteConsulta.invalidateQueries({ queryKey: ['execucoes-avaliacao', espacoId, conjuntoId] });
      notificar('Avaliacao agendada para processamento.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const cancelar = useMutation({
    mutationFn: (execucaoId: string) => servico.cancelarAvaliacao(espacoId, conjuntoId!, execucaoId),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['execucoes-avaliacao', espacoId, conjuntoId] });
      notificar('Cancelamento solicitado.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const submeterConjunto = (evento: FormEvent) => {
    evento.preventDefault();
    if (nome.trim().length < 3) return notificar('Informe um nome valido.', 'erro');
    criarConjunto.mutate();
  };

  const submeterCaso = (evento: FormEvent) => {
    evento.preventDefault();
    if (pergunta.trim().length < 3 || (!deveRecusar && !termos.trim())) {
      return notificar('Informe a pergunta e os termos esperados.', 'erro');
    }
    adicionarCaso.mutate();
  };

  return (
    <div className="page-container">
      <CabecalhoPagina
        titulo="Avaliacoes de qualidade"
        descricao="Meça precisao, fontes, latencia e custo antes de alterar a IA."
        acoes={<Botao variante="primario" icone={Plus} onClick={() => definirModalConjunto(true)}>Novo conjunto</Botao>}
      />

      {!conjuntos.isLoading && conjuntos.data?.length === 0 ? (
        <EstadoVazio icone={Beaker} titulo="Nenhuma avaliacao configurada" descricao="Crie perguntas de referencia para detectar regressoes nas respostas." acao={<Botao variante="primario" icone={Plus} onClick={() => definirModalConjunto(true)}>Criar conjunto</Botao>} />
      ) : (
        <div className="evaluation-layout">
          <aside className="evaluation-sidebar">
            <span className="panel-label">Conjuntos</span>
            {conjuntos.data?.map((conjunto) => (
              <button className={conjunto.id === conjuntoId ? 'active' : ''} type="button" key={conjunto.id} onClick={() => { definirConjuntoId(conjunto.id); definirExecucaoSelecionada(null); }}>
                <strong>{conjunto.nome}</strong><small>{conjunto.quantidadeCasos} casos</small>
              </button>
            ))}
          </aside>

          <div className="evaluation-main">
            <section className="evaluation-command-bar">
              <div><strong>{conjuntos.data?.find((item) => item.id === conjuntoId)?.nome}</strong><span>{casos.data?.length ?? 0} casos cadastrados</span></div>
              <div className="evaluation-controls">
                <label>Baseline<select value={baselineId} onChange={(evento) => definirBaselineId(evento.target.value)}><option value="">Sem comparacao</option>{execucoes.data?.filter((execucao) => execucao.estado === 'CONCLUIDO').map((execucao) => <option value={execucao.id} key={execucao.id}>{formatarData(execucao.finalizadaEm)}</option>)}</select></label>
                <Botao icone={Plus} onClick={() => definirModalCaso(true)} disabled={!conjuntoId}>Caso</Botao>
                <Botao variante="primario" icone={Play} onClick={() => executar.mutate()} carregando={executar.isPending} disabled={!conjuntoId || !casos.data?.length}>Executar</Botao>
              </div>
            </section>

            {execucaoAtual ? (
              <>
                <section className="metric-strip evaluation-metrics" aria-label="Metricas da execucao selecionada">
                  <article><span className="metric-icon metric-green"><Target size={19} /></span><div><strong>{formatarPercentual(execucaoAtual.taxaAcerto)}</strong><small>taxa de acerto</small></div></article>
                  <article><span className="metric-icon metric-blue"><Gauge size={19} /></span><div><strong>{formatarPercentual(execucaoAtual.recallMedio)}</strong><small>recall medio</small></div></article>
                  <article><span className="metric-icon metric-amber"><Clock3 size={19} /></span><div><strong>{execucaoAtual.latenciaP95Ms} ms</strong><small>latencia p95</small></div></article>
                  <article><span className="metric-icon metric-violet"><DollarSign size={19} /></span><div><strong>{formatarMoedaUsd(execucaoAtual.custoTotalUsd)}</strong><small>custo total</small></div></article>
                </section>

                <section className="section-panel evaluation-progress-panel">
                  <header className="section-header"><div><h2>Execucao selecionada</h2><p>Iniciada em {formatarData(execucaoAtual.iniciadaEm)}</p></div><Status tom={tomDoEstado(execucaoAtual.estado)}>{execucaoAtual.estado}</Status></header>
                  <div className="run-progress"><progress value={execucaoAtual.casosProcessados} max={Math.max(execucaoAtual.totalCasos, 1)} /><span>{execucaoAtual.casosProcessados} de {execucaoAtual.totalCasos} casos</span></div>
                  {['AGENDADA', 'EM_EXECUCAO', 'PROCESSANDO'].includes(execucaoAtual.estado) && <Botao variante="perigo" icone={CircleStop} onClick={() => cancelar.mutate(execucaoAtual.id)} carregando={cancelar.isPending}>Cancelar execucao</Botao>}
                  {execucaoAtual.erro && <p className="cell-error">{execucaoAtual.erro}</p>}
                </section>

                <section className="section-panel">
                  <header className="section-header"><div><h2>Resultados por caso</h2><p>Diagnostico das respostas processadas.</p></div></header>
                  {execucaoAtual.resultados?.length ? <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Caso</th><th>Resultado</th><th>Termos</th><th>Fontes</th><th>Latencia</th></tr></thead><tbody>{execucaoAtual.resultados.map((resultado) => <tr key={resultado.casoId}><td><code>{resultado.casoId.slice(0, 8)}</code></td><td><Status tom={resultado.aprovado ? 'sucesso' : 'erro'}>{resultado.aprovado ? 'APROVADO' : 'REPROVADO'}</Status></td><td>{formatarPercentual(resultado.pontuacaoTermos)}</td><td>{formatarPercentual(resultado.pontuacaoFontes)}</td><td>{resultado.latenciaMs} ms</td></tr>)}</tbody></table></div> : <div className="inline-empty"><ListChecks size={20} /><span>Os resultados aparecem quando a execucao termina.</span></div>}
                </section>
              </>
            ) : (
              <EstadoVazio icone={BarChart3} titulo="Ainda nao ha execucoes" descricao="Adicione casos e execute o conjunto para criar uma linha de base." />
            )}

            <section className="section-panel">
              <header className="section-header"><div><h2>Historico</h2><p>Execucoes recentes deste conjunto.</p></div></header>
              <div className="run-history">{execucoes.data?.map((execucao) => <button className={execucao.id === execucaoAtual?.id ? 'active' : ''} type="button" key={execucao.id} onClick={() => definirExecucaoSelecionada(execucao.id)}><Status tom={tomDoEstado(execucao.estado)}>{execucao.estado}</Status><span>{formatarData(execucao.iniciadaEm)}</span><strong>{execucao.casosAprovados}/{execucao.totalCasos}</strong></button>)}</div>
            </section>
          </div>
        </div>
      )}

      <Modal aberto={modalConjunto} titulo="Novo conjunto" descricao="Agrupe perguntas que representam o comportamento esperado." aoFechar={() => definirModalConjunto(false)}>
        <form className="form-stack" onSubmit={submeterConjunto}><label><span>Nome</span><input value={nome} onChange={(evento) => definirNome(evento.target.value)} maxLength={160} autoFocus required /></label><label><span>Descricao</span><textarea value={descricao} onChange={(evento) => definirDescricao(evento.target.value)} rows={3} maxLength={500} /></label><div className="modal-actions"><Botao type="button" onClick={() => definirModalConjunto(false)}>Cancelar</Botao><Botao type="submit" variante="primario" carregando={criarConjunto.isPending}>Criar conjunto</Botao></div></form>
      </Modal>

      <Modal aberto={modalCaso} titulo="Adicionar caso" descricao="Defina uma pergunta e o que torna a resposta correta." aoFechar={() => definirModalCaso(false)} largura="larga">
        <form className="form-stack" onSubmit={submeterCaso}><label><span>Pergunta</span><textarea value={pergunta} onChange={(evento) => definirPergunta(evento.target.value)} rows={3} maxLength={2000} autoFocus required /></label><label><span>Termos esperados <small>separados por virgula</small></span><input value={termos} onChange={(evento) => definirTermos(evento.target.value)} placeholder="prazo, reembolso, 30 dias" disabled={deveRecusar} /></label><label className="checkbox-field"><input type="checkbox" checked={deveRecusar} onChange={(evento) => definirDeveRecusar(evento.target.checked)} /><span>A resposta correta deve recusar por falta de contexto ou permissao.</span></label><div className="modal-actions"><Botao type="button" onClick={() => definirModalCaso(false)}>Cancelar</Botao><Botao type="submit" variante="primario" carregando={adicionarCaso.isPending}>Adicionar caso</Botao></div></form>
      </Modal>
    </div>
  );
}
