import { useQueries, useQuery } from '@tanstack/react-query';
import { ArrowRight, Bot, Database, FileCheck2, FileText, MessageSquareText, Plus, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { EstadoVazio } from '../../components/ui/empty-state';
import { Status, tomDoEstado } from '../../components/ui/status-badge';
import { formatarBytes, formatarData, formatarMoedaUsd, formatarNumero, formatarPercentual, limitarTexto } from '../../lib/formatters';

export function PaginaVisaoGeral() {
  const { espacoId = '' } = useParams();
  const servico = useServico();
  const espaco = useQuery({
    queryKey: ['espaco', espacoId],
    queryFn: () => servico.buscarEspaco(espacoId),
    enabled: Boolean(espacoId),
  });
  const resultados = useQueries({
    queries: [
      { queryKey: ['documentos', espacoId], queryFn: () => servico.listarDocumentos(espacoId) },
      { queryKey: ['conversas', espacoId], queryFn: () => servico.listarConversas(espacoId) },
      { queryKey: ['uso', espacoId], queryFn: () => servico.consultarUso(espacoId) },
      { queryKey: ['indices', espacoId], queryFn: () => servico.listarIndices(espacoId) },
    ],
  });
  const documentos = resultados[0].data ?? [];
  const conversas = resultados[1].data ?? [];
  const uso = resultados[2].data;
  const indices = resultados[3].data ?? [];
  const carregando = resultados.some((resultado) => resultado.isLoading) || espaco.isLoading;
  const documentosProntos = documentos.filter((documento) => documento.estado === 'PRONTO').length;
  const indiceAtivo = indices.find((indice) => indice.estado === 'ATIVO');
  const percentualArmazenamento = uso?.limiteArmazenamentoBytes
    ? uso.armazenamentoUsadoBytes / uso.limiteArmazenamentoBytes
    : 0;

  return (
    <div className="page-container">
      <CabecalhoPagina
        titulo={espaco.data?.nome ?? 'Visao geral'}
        descricao={espaco.data?.descricao || 'Acompanhe o conhecimento disponivel neste espaco.'}
        acoes={
          <>
            <Link className="button button-secundario" to={`/espacos/${espacoId}/documentos`}><Plus size={17} aria-hidden="true" /> Documento</Link>
            <Link className="button button-primario" to={`/espacos/${espacoId}/conversas`}><MessageSquareText size={17} aria-hidden="true" /> Nova conversa</Link>
          </>
        }
      />

      {carregando && <div className="loading-line" aria-label="Carregando indicadores" />}

      <section className="metric-strip" aria-label="Indicadores do espaco">
        <article>
          <span className="metric-icon metric-green"><FileCheck2 size={19} aria-hidden="true" /></span>
          <div><strong>{formatarNumero(documentosProntos)}</strong><small>documentos prontos</small></div>
        </article>
        <article>
          <span className="metric-icon metric-blue"><Bot size={19} aria-hidden="true" /></span>
          <div><strong>{formatarNumero(conversas.length)}</strong><small>conversas</small></div>
        </article>
        <article>
          <span className="metric-icon metric-amber"><Sparkles size={19} aria-hidden="true" /></span>
          <div><strong>{formatarNumero(uso?.consultasHoje ?? 0)}</strong><small>consultas hoje</small></div>
        </article>
        <article>
          <span className="metric-icon metric-violet"><Database size={19} aria-hidden="true" /></span>
          <div><strong>{formatarBytes(uso?.armazenamentoUsadoBytes ?? 0)}</strong><small>armazenamento</small></div>
        </article>
      </section>

      <div className="overview-grid">
        <section className="section-panel">
          <header className="section-header">
            <div><h2>Documentos recentes</h2><p>Arquivos mais novos e estado da indexacao.</p></div>
            <Link to={`/espacos/${espacoId}/documentos`}>Ver todos <ArrowRight size={15} aria-hidden="true" /></Link>
          </header>
          {documentos.length === 0 ? (
            <EstadoVazio icone={FileText} titulo="Nenhum documento" descricao="Envie a primeira fonte de conhecimento deste espaco." />
          ) : (
            <div className="compact-list">
              {documentos.slice(0, 5).map((documento) => (
                <div className="compact-row" key={documento.id}>
                  <span className="file-type">{documento.nomeArquivo.split('.').pop()?.slice(0, 4).toUpperCase()}</span>
                  <div><strong>{documento.titulo}</strong><small>{documento.nomeArquivo} · {formatarData(documento.criadoEm)}</small></div>
                  <Status tom={tomDoEstado(documento.estado)}>{documento.estado}</Status>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="overview-side">
          <section className="section-panel usage-panel">
            <header className="section-header"><div><h2>Uso do espaco</h2><p>Limites operacionais de hoje.</p></div></header>
            <div className="usage-item">
              <div><span>Armazenamento</span><strong>{formatarPercentual(percentualArmazenamento)}</strong></div>
              <progress value={Math.min(percentualArmazenamento, 1)} max={1} />
              <small>{formatarBytes(uso?.armazenamentoUsadoBytes ?? 0)} de {formatarBytes(uso?.limiteArmazenamentoBytes ?? 0)}</small>
            </div>
            <div className="usage-item">
              <div><span>Consultas</span><strong>{uso?.consultasHoje ?? 0} / {uso?.limiteConsultasDia ?? 0}</strong></div>
              <progress value={uso?.consultasHoje ?? 0} max={Math.max(uso?.limiteConsultasDia ?? 1, 1)} />
            </div>
            <div className="cost-line"><span>Custo estimado em 30 dias</span><strong>{formatarMoedaUsd(uso?.custoEstimadoUsdUltimos30Dias ?? 0)}</strong></div>
          </section>

          <section className="section-panel index-panel">
            <header className="section-header"><div><h2>Indice de busca</h2><p>Modelo atualmente ativo.</p></div></header>
            {indiceAtivo ? (
              <div className="index-summary"><Status tom="sucesso">ATIVO</Status><strong>{indiceAtivo.modelo}</strong><span>{indiceAtivo.provedor} · {indiceAtivo.dimensoes} dimensoes</span></div>
            ) : (
              <div className="inline-empty"><Database size={20} aria-hidden="true" /><span>Nenhum indice ativo.</span></div>
            )}
          </section>
        </aside>
      </div>

      <section className="section-panel">
        <header className="section-header">
          <div><h2>Conversas recentes</h2><p>Ultimas consultas feitas neste espaco.</p></div>
          <Link to={`/espacos/${espacoId}/conversas`}>Abrir conversas <ArrowRight size={15} aria-hidden="true" /></Link>
        </header>
        {conversas.length === 0 ? (
          <div className="inline-empty"><MessageSquareText size={20} aria-hidden="true" /><span>Ainda nao ha conversas neste espaco.</span></div>
        ) : (
          <div className="conversation-table">
            {conversas.slice(0, 6).map((conversa) => (
              <Link to={`/espacos/${espacoId}/conversas/${conversa.id}`} key={conversa.id}>
                <Bot size={18} aria-hidden="true" />
                <div><strong>{limitarTexto(conversa.titulo, 72)}</strong><small>{conversa.quantidadeMensagens} mensagens · atualizada em {formatarData(conversa.atualizadaEm)}</small></div>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
