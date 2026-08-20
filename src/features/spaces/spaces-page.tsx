import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BookOpenText, Building2, Plus, ShieldCheck } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { Botao } from '../../components/ui/button';
import { EstadoVazio } from '../../components/ui/empty-state';
import { Modal } from '../../components/ui/modal';
import { useNotificacao } from '../../components/ui/notification';
import { Status } from '../../components/ui/status-badge';
import { formatarData } from '../../lib/formatters';
import { mensagemDeErro } from '../../lib/api-client';
import type { PapelMembro } from '../../types/api';

const rotulosPapel: Record<PapelMembro, string> = {
  PROPRIETARIO: 'Proprietario',
  CURADOR: 'Curador',
  LEITOR: 'Leitor',
};

export function PaginaEspacos() {
  const servico = useServico();
  const navegar = useNavigate();
  const clienteConsulta = useQueryClient();
  const { notificar } = useNotificacao();
  const [modalAberto, definirModalAberto] = useState(false);
  const [nome, definirNome] = useState('');
  const [descricao, definirDescricao] = useState('');

  const consulta = useQuery({ queryKey: ['espacos'], queryFn: () => servico.listarEspacos() });
  const criar = useMutation({
    mutationFn: () => servico.criarEspaco(nome.trim(), descricao.trim()),
    onSuccess: async (espaco) => {
      await clienteConsulta.invalidateQueries({ queryKey: ['espacos'] });
      notificar('Espaco criado com sucesso.', 'sucesso');
      definirModalAberto(false);
      definirNome('');
      definirDescricao('');
      navegar(`/espacos/${espaco.id}`);
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const aoEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (nome.trim().length < 3) {
      notificar('Informe um nome com pelo menos 3 caracteres.', 'erro');
      return;
    }
    criar.mutate();
  };

  return (
    <div className="page-container">
      <CabecalhoPagina
        titulo="Espacos de conhecimento"
        descricao="Escolha o contexto em que voce vai trabalhar."
        acoes={<Botao variante="primario" icone={Plus} onClick={() => definirModalAberto(true)}>Novo espaco</Botao>}
      />

      {consulta.isLoading && <div className="loading-block" aria-label="Carregando espacos"><span /><span /><span /></div>}
      {consulta.isError && (
        <div className="error-banner" role="alert">
          <strong>Nao foi possivel carregar seus espacos.</strong>
          <button type="button" onClick={() => void consulta.refetch()}>Tentar novamente</button>
        </div>
      )}
      {consulta.data?.length === 0 && (
        <EstadoVazio
          icone={Building2}
          titulo="Seu primeiro espaco comeca aqui"
          descricao="Separe documentos, membros e conversas por equipe ou finalidade."
          acao={<Botao variante="primario" icone={Plus} onClick={() => definirModalAberto(true)}>Criar espaco</Botao>}
        />
      )}

      <div className="space-list">
        {consulta.data?.map((espaco) => (
          <button className="space-row" type="button" key={espaco.id} onClick={() => navegar(`/espacos/${espaco.id}`)}>
            <span className="space-row-icon"><BookOpenText size={21} aria-hidden="true" /></span>
            <span className="space-row-copy">
              <strong>{espaco.nome}</strong>
              <small>{espaco.descricao || 'Sem descricao cadastrada'}</small>
            </span>
            <span className="space-row-meta">
              <Status tom={espaco.meuPapel === 'PROPRIETARIO' ? 'sucesso' : 'informacao'}>
                <ShieldCheck size={13} aria-hidden="true" /> {rotulosPapel[espaco.meuPapel]}
              </Status>
              <small>Criado em {formatarData(espaco.criadoEm)}</small>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        ))}
      </div>

      <Modal aberto={modalAberto} titulo="Criar espaco" descricao="Defina um contexto isolado para documentos e conversas." aoFechar={() => definirModalAberto(false)}>
        <form className="form-stack" onSubmit={aoEnviar}>
          <label>
            <span>Nome</span>
            <input value={nome} onChange={(evento) => definirNome(evento.target.value)} maxLength={120} autoFocus required placeholder="Ex.: Operacoes e processos" />
          </label>
          <label>
            <span>Descricao</span>
            <textarea value={descricao} onChange={(evento) => definirDescricao(evento.target.value)} maxLength={500} rows={4} placeholder="Qual conhecimento sera organizado neste espaco?" />
          </label>
          <div className="modal-actions">
            <Botao type="button" onClick={() => definirModalAberto(false)}>Cancelar</Botao>
            <Botao type="submit" variante="primario" carregando={criar.isPending}>Criar espaco</Botao>
          </div>
        </form>
      </Modal>
    </div>
  );
}
