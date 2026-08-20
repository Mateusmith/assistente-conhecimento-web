import { useMutation } from '@tanstack/react-query';
import { Download, FileJson, LockKeyhole, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useServico } from '../../app/service-context';
import { useAutenticacao } from '../../auth/auth-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { Botao } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { useNotificacao } from '../../components/ui/notification';
import { mensagemDeErro } from '../../lib/api-client';
import { formatarData } from '../../lib/formatters';

const CONFIRMACAO = 'EXCLUIR MEUS DADOS';

export function PaginaPrivacidade() {
  const servico = useServico();
  const { usuario, sair } = useAutenticacao();
  const { notificar } = useNotificacao();
  const [modalExclusao, definirModalExclusao] = useState(false);
  const [confirmacao, definirConfirmacao] = useState('');

  const exportar = useMutation({
    mutationFn: () => servico.exportarPrivacidade(),
    onSuccess: (dados) => {
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
      const endereco = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = endereco;
      link.download = `meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(endereco);
      notificar('Exportacao gerada com sucesso.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const excluir = useMutation({
    mutationFn: () => servico.excluirMeusDados(),
    onSuccess: async (resultado) => {
      notificar(`${resultado.consultasExcluidas} consultas e ${resultado.conversasExcluidas} conversas removidas.`, 'sucesso');
      definirModalExclusao(false);
      await sair();
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  function confirmarExclusao(evento: FormEvent) {
    evento.preventDefault();
    if (confirmacao !== CONFIRMACAO) {
      notificar('Digite a frase de confirmacao exatamente como exibida.', 'erro');
      return;
    }
    excluir.mutate();
  }

  return (
    <div className="page-container narrow-page">
      <CabecalhoPagina titulo="Privacidade e meus dados" descricao="Consulte ou remova os dados vinculados a sua identidade." />

      <section className="privacy-identity">
        <span><ShieldCheck size={25} aria-hidden="true" /></span>
        <div><h2>{(usuario?.profile.name as string | undefined) ?? usuario?.profile.preferred_username}</h2><p>{usuario?.profile.email as string | undefined}</p></div>
        <small>Sessao valida ate {formatarData(usuario?.expires_at ? new Date(usuario.expires_at * 1000).toISOString() : null)}</small>
      </section>

      <section className="section-panel privacy-section">
        <div className="privacy-icon"><FileJson size={22} aria-hidden="true" /></div>
        <div className="privacy-copy"><h2>Exportar meus dados</h2><p>Baixe espacos, documentos, consultas, conversas, feedbacks e eventos associados a sua conta em formato JSON.</p></div>
        <Botao icone={Download} onClick={() => exportar.mutate()} carregando={exportar.isPending}>Gerar exportacao</Botao>
      </section>

      <section className="section-panel privacy-section">
        <div className="privacy-icon"><LockKeyhole size={22} aria-hidden="true" /></div>
        <div className="privacy-copy"><h2>Como seus dados sao protegidos</h2><p>O backend aplica autorizacao antes da recuperacao, tokeniza dados sensiveis enviados a provedores externos e registra operacoes relevantes.</p></div>
        <span className="privacy-policy-status"><ShieldCheck size={16} aria-hidden="true" /> Politicas ativas</span>
      </section>

      <section className="danger-zone">
        <header><div><h2>Excluir meus dados</h2><p>A operacao remove consultas, conversas e vinculos pessoais, preservando somente registros pseudonimizados exigidos para integridade.</p></div><Botao variante="perigo" icone={Trash2} onClick={() => definirModalExclusao(true)}>Solicitar exclusao</Botao></header>
      </section>

      <Modal aberto={modalExclusao} titulo="Excluir meus dados" descricao="Esta operacao nao pode ser desfeita." aoFechar={() => definirModalExclusao(false)}>
        <form className="form-stack" onSubmit={confirmarExclusao}>
          <div className="destructive-warning"><Trash2 size={20} aria-hidden="true" /><p>Suas conversas e consultas deixarao de aparecer imediatamente.</p></div>
          <label><span>Digite <code>{CONFIRMACAO}</code></span><input value={confirmacao} onChange={(evento) => definirConfirmacao(evento.target.value)} autoComplete="off" required /></label>
          <div className="modal-actions"><Botao type="button" onClick={() => definirModalExclusao(false)}>Cancelar</Botao><Botao type="submit" variante="perigo" carregando={excluir.isPending} disabled={confirmacao !== CONFIRMACAO}>Excluir definitivamente</Botao></div>
        </form>
      </Modal>
    </div>
  );
}
