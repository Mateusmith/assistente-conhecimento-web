import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Database,
  Play,
  Plus,
  Save,
  SearchCheck,
  Shield,
  Users,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { Botao } from '../../components/ui/button';
import { EstadoVazio } from '../../components/ui/empty-state';
import { Modal } from '../../components/ui/modal';
import { useNotificacao } from '../../components/ui/notification';
import { Status, tomDoEstado } from '../../components/ui/status-badge';
import { mensagemDeErro } from '../../lib/api-client';
import { formatarData, formatarPercentual } from '../../lib/formatters';
import type { Governanca, PapelMembro } from '../../types/api';

type Aba = 'equipe' | 'governanca' | 'indices' | 'busca' | 'auditoria';

const usuariosDemonstracao = [
  { id: 'ana', nome: 'Ana Administradora', usuario: 'ana' },
  { id: 'bruno', nome: 'Bruno Curador', usuario: 'bruno' },
  { id: 'carla', nome: 'Carla Leitora', usuario: 'carla' },
];

const rotuloAcao: Record<string, string> = {
  ESPACO_CRIADO: 'Espaco criado',
  MEMBRO_ADICIONADO: 'Membro adicionado',
  DOCUMENTO_ENVIADO: 'Documento enviado',
  DOCUMENTO_PROCESSADO: 'Documento processado',
  DOCUMENTO_PERMISSAO_CONCEDIDA: 'Permissao concedida',
  CONSULTA_REALIZADA: 'Consulta realizada',
};

export function PaginaAdministracao() {
  const { espacoId = '' } = useParams();
  const servico = useServico();
  const clienteConsulta = useQueryClient();
  const { notificar } = useNotificacao();
  const [aba, definirAba] = useState<Aba>('equipe');
  const [modalMembro, definirModalMembro] = useState(false);
  const [usuarioId, definirUsuarioId] = useState(usuariosDemonstracao[2]!.id);
  const [papel, definirPapel] = useState<PapelMembro>('LEITOR');
  const [limiteGbInformado, definirLimiteGb] = useState<number | null>(null);
  const [consultasDiaInformadas, definirConsultasDia] = useState<number | null>(null);
  const [uploadsDiaInformados, definirUploadsDia] = useState<number | null>(null);
  const [retencaoDiasInformada, definirRetencaoDias] = useState<number | null>(null);
  const [modeloInformado, definirModelo] = useState('');
  const [perguntaBusca, definirPerguntaBusca] = useState('');

  const espaco = useQuery({ queryKey: ['espaco', espacoId], queryFn: () => servico.buscarEspaco(espacoId) });
  const membros = useQuery({ queryKey: ['membros', espacoId], queryFn: () => servico.listarMembros(espacoId) });
  const governanca = useQuery({ queryKey: ['governanca', espacoId], queryFn: () => servico.buscarGovernanca(espacoId) });
  const indices = useQuery({
    queryKey: ['indices', espacoId],
    queryFn: () => servico.listarIndices(espacoId),
    refetchInterval: (consulta) => consulta.state.data?.some((item) => item.estado === 'CONSTRUINDO') ? 2500 : false,
  });
  const modelos = useQuery({ queryKey: ['modelos-indice', espacoId], queryFn: () => servico.listarModelos(espacoId) });
  const auditoria = useQuery({
    queryKey: ['auditoria', espacoId],
    queryFn: () => servico.listarAuditoria(espacoId),
    enabled: aba === 'auditoria' && espaco.data?.meuPapel === 'PROPRIETARIO',
  });
  const limiteGb = limiteGbInformado ?? Number(((governanca.data?.limiteArmazenamentoBytes ?? 1024 ** 3) / 1024 ** 3).toFixed(2));
  const consultasDia = consultasDiaInformadas ?? governanca.data?.limiteConsultasDia ?? 500;
  const uploadsDia = uploadsDiaInformados ?? governanca.data?.limiteUploadsDia ?? 100;
  const retencaoDias = retencaoDiasInformada ?? governanca.data?.retencaoConsultasDias ?? 365;
  const modelo = modeloInformado || modelos.data?.[0]?.modelo || '';

  const adicionarMembro = useMutation({
    mutationFn: () => servico.adicionarMembro(espacoId, usuarioId, papel),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['membros', espacoId] });
      definirModalMembro(false);
      notificar('Membro adicionado ao espaco.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const salvarGovernanca = useMutation({
    mutationFn: () => servico.atualizarGovernanca(espacoId, {
      espacoId,
      limiteArmazenamentoBytes: Math.round(limiteGb * 1024 ** 3),
      limiteConsultasDia: consultasDia,
      limiteUploadsDia: uploadsDia,
      retencaoConsultasDias: retencaoDias,
    }),
    onSuccess: (dados) => {
      clienteConsulta.setQueryData<Governanca>(['governanca', espacoId], dados);
      void clienteConsulta.invalidateQueries({ queryKey: ['uso', espacoId] });
      notificar('Politicas de governanca atualizadas.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const criarIndice = useMutation({
    mutationFn: () => servico.criarIndice(espacoId, modelo),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['indices', espacoId] });
      notificar('Novo indice iniciado sem interromper o indice ativo.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const ativarIndice = useMutation({
    mutationFn: (indiceId: string) => servico.ativarIndice(espacoId, indiceId),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['indices', espacoId] });
      notificar('Indice ativado com sucesso.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const compararBusca = useMutation({
    mutationFn: () => servico.compararBuscas(espacoId, perguntaBusca.trim()),
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const abas: Array<{ id: Aba; rotulo: string; icone: typeof Users }> = [
    { id: 'equipe', rotulo: 'Equipe', icone: Users },
    { id: 'governanca', rotulo: 'Governanca', icone: Shield },
    { id: 'indices', rotulo: 'Indices', icone: Database },
    { id: 'busca', rotulo: 'Laboratorio de busca', icone: SearchCheck },
    { id: 'auditoria', rotulo: 'Auditoria', icone: Activity },
  ];

  return (
    <div className="page-container">
      <CabecalhoPagina titulo="Administracao" descricao="Controle acesso, qualidade de busca e limites operacionais." />
      <div className="tab-list" role="tablist" aria-label="Areas de administracao">
        {abas.map(({ id, rotulo, icone: Icone }) => <button role="tab" aria-selected={aba === id} className={aba === id ? 'active' : ''} type="button" key={id} onClick={() => definirAba(id)}><Icone size={16} aria-hidden="true" />{rotulo}</button>)}
      </div>

      {aba === 'equipe' && (
        <section className="section-panel">
          <header className="section-header"><div><h2>Membros do espaco</h2><p>Papeis definem quem consulta e quem administra conhecimento.</p></div>{espaco.data?.meuPapel === 'PROPRIETARIO' && <Botao variante="primario" icone={Plus} onClick={() => definirModalMembro(true)}>Adicionar membro</Botao>}</header>
          <div className="member-list">{membros.data?.map((membro) => {
            const conhecido = usuariosDemonstracao.find((usuario) => usuario.id === membro.usuarioId);
            return <div className="member-row" key={membro.usuarioId}><span className="member-avatar">{(conhecido?.nome ?? membro.usuarioId).charAt(0).toUpperCase()}</span><div><strong>{conhecido?.nome ?? membro.usuarioId}</strong><small>{conhecido ? `@${conhecido.usuario}` : membro.usuarioId}</small></div><Status tom={membro.papel === 'PROPRIETARIO' ? 'sucesso' : membro.papel === 'CURADOR' ? 'informacao' : 'neutro'}>{membro.papel}</Status><small>Desde {formatarData(membro.adicionadoEm)}</small></div>;
          })}</div>
        </section>
      )}

      {aba === 'governanca' && (
        <section className="section-panel settings-panel">
          <header className="section-header"><div><h2>Limites e retencao</h2><p>Politicas aplicadas pelo backend em todas as replicas.</p></div></header>
          <form className="settings-form" onSubmit={(evento) => { evento.preventDefault(); salvarGovernanca.mutate(); }}>
            <label><span>Armazenamento maximo</span><div className="input-suffix"><input type="number" min="0.01" max="1024" step="0.01" value={limiteGb} onChange={(evento) => definirLimiteGb(Number(evento.target.value))} /><span>GB</span></div></label>
            <label><span>Consultas por dia</span><input type="number" min="1" max="1000000" value={consultasDia} onChange={(evento) => definirConsultasDia(Number(evento.target.value))} /></label>
            <label><span>Uploads por dia</span><input type="number" min="1" max="100000" value={uploadsDia} onChange={(evento) => definirUploadsDia(Number(evento.target.value))} /></label>
            <label><span>Retencao das consultas</span><div className="input-suffix"><input type="number" min="1" max="3650" value={retencaoDias} onChange={(evento) => definirRetencaoDias(Number(evento.target.value))} /><span>dias</span></div></label>
            <div className="settings-actions"><Botao variante="primario" icone={Save} type="submit" carregando={salvarGovernanca.isPending} disabled={espaco.data?.meuPapel !== 'PROPRIETARIO'}>Salvar politicas</Botao></div>
          </form>
        </section>
      )}

      {aba === 'indices' && (
        <section className="section-panel">
          <header className="section-header"><div><h2>Indices de embedding</h2><p>Construa uma nova versao em paralelo e ative somente quando estiver pronta.</p></div><div className="inline-form"><select value={modelo} onChange={(evento) => definirModelo(evento.target.value)}>{modelos.data?.map((item) => <option key={item.modelo} value={item.modelo}>{item.modelo} · {item.provedor}</option>)}</select><Botao variante="primario" icone={Plus} onClick={() => criarIndice.mutate()} carregando={criarIndice.isPending} disabled={!modelo}>Novo indice</Botao></div></header>
          {indices.data?.length ? <div className="index-list">{indices.data.map((indice) => <div className="index-row" key={indice.id}><div><strong>{indice.modelo}</strong><small>{indice.provedor} · {indice.dimensoes} dimensoes · criado em {formatarData(indice.criadoEm)}</small></div><div className="index-progress"><progress value={indice.progressoPercentual} max={100} /><small>{indice.progressoPercentual}% · {indice.trechosProcessados}/{indice.totalTrechos} trechos</small></div><Status tom={tomDoEstado(indice.estado)}>{indice.estado}</Status>{indice.estado === 'ARQUIVADO' && indice.progressoPercentual === 100 && <Botao icone={Play} onClick={() => ativarIndice.mutate(indice.id)} carregando={ativarIndice.isPending}>Ativar</Botao>}</div>)}</div> : <EstadoVazio icone={Database} titulo="Nenhum indice encontrado" descricao="Crie o primeiro indice para habilitar a busca semantica." />}
        </section>
      )}

      {aba === 'busca' && (
        <section className="section-panel search-lab">
          <header className="section-header"><div><h2>Comparar estrategias</h2><p>Veja como busca hibrida, semantica e textual recuperam as mesmas fontes.</p></div></header>
          <form className="lab-form" onSubmit={(evento: FormEvent) => { evento.preventDefault(); if (perguntaBusca.trim()) compararBusca.mutate(); }}><input value={perguntaBusca} onChange={(evento) => definirPerguntaBusca(evento.target.value)} placeholder="Digite uma pergunta para comparar" maxLength={2000} /><Botao variante="primario" icone={SearchCheck} type="submit" carregando={compararBusca.isPending}>Comparar</Botao></form>
          {compararBusca.data && <div className="strategy-grid">{compararBusca.data.resultados.map((resultado) => <article key={resultado.estrategia}><header><strong>{resultado.estrategia}</strong><Status tom="informacao">{resultado.fontes.length} fontes</Status></header>{resultado.fontes.slice(0, 4).map((fonte) => <div className="strategy-result" key={fonte.trechoId}><strong>{fonte.tituloDocumento}</strong><p>{fonte.conteudo}</p><small>{formatarPercentual(fonte.pontuacao)} relevancia</small></div>)}</article>)}</div>}
        </section>
      )}

      {aba === 'auditoria' && (
        <section className="section-panel">
          <header className="section-header"><div><h2>Eventos de auditoria</h2><p>Registro das operacoes relevantes deste espaco.</p></div></header>
          {espaco.data?.meuPapel !== 'PROPRIETARIO' ? <EstadoVazio icone={Shield} titulo="Acesso exclusivo do proprietario" descricao="O historico de auditoria contem eventos operacionais protegidos." /> : <div className="audit-timeline">{auditoria.data?.map((evento) => <div className="audit-row" key={evento.id}><span className="audit-marker" /><div><strong>{rotuloAcao[evento.acao] ?? evento.acao.replaceAll('_', ' ')}</strong><small>{evento.recurso} · {evento.recursoId}</small></div><code>{evento.usuarioId.slice(0, 12)}</code><time>{formatarData(evento.criadoEm)}</time></div>)}</div>}
        </section>
      )}

      <Modal aberto={modalMembro} titulo="Adicionar membro" descricao="Selecione um usuario do provedor de identidade local." aoFechar={() => definirModalMembro(false)}>
        <form className="form-stack" onSubmit={(evento) => { evento.preventDefault(); adicionarMembro.mutate(); }}><label><span>Usuario</span><select value={usuarioId} onChange={(evento) => definirUsuarioId(evento.target.value)}>{usuariosDemonstracao.map((usuario) => <option value={usuario.id} key={usuario.id}>{usuario.nome} (@{usuario.usuario})</option>)}</select></label><label><span>Papel</span><select value={papel} onChange={(evento) => definirPapel(evento.target.value as PapelMembro)}><option value="LEITOR">Leitor</option><option value="CURADOR">Curador</option><option value="PROPRIETARIO">Proprietario</option></select></label><div className="modal-actions"><Botao type="button" onClick={() => definirModalMembro(false)}>Cancelar</Botao><Botao type="submit" variante="primario" carregando={adicionarMembro.isPending}>Adicionar membro</Botao></div></form>
      </Modal>
    </div>
  );
}
