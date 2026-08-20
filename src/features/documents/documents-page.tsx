import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  FileArchive,
  FileImage,
  FileText,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  UserPlus,
} from 'lucide-react';
import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { CabecalhoPagina } from '../../components/layout/page-header';
import { Botao } from '../../components/ui/button';
import { EstadoVazio } from '../../components/ui/empty-state';
import { Modal } from '../../components/ui/modal';
import { useNotificacao } from '../../components/ui/notification';
import { Status, tomDoEstado } from '../../components/ui/status-badge';
import { mensagemDeErro } from '../../lib/api-client';
import { formatarBytes, formatarData } from '../../lib/formatters';
import type { Documento, VisibilidadeDocumento } from '../../types/api';

const LIMITE_ARQUIVO = 10 * 1024 * 1024;

function iconeDoArquivo(tipoMime: string) {
  if (tipoMime.startsWith('image/')) return FileImage;
  if (tipoMime.includes('pdf')) return FileArchive;
  return FileText;
}

function converterMetadados(valor: string): Record<string, string> {
  return Object.fromEntries(
    valor
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [chave, ...restante] = item.split('=');
        return [chave?.trim() ?? '', restante.join('=').trim()];
      })
      .filter(([chave, conteudo]) => Boolean(chave && conteudo)),
  );
}

export function PaginaDocumentos() {
  const { espacoId = '' } = useParams();
  const servico = useServico();
  const clienteConsulta = useQueryClient();
  const { notificar } = useNotificacao();
  const seletorArquivo = useRef<HTMLInputElement>(null);
  const [busca, definirBusca] = useState('');
  const [modalUpload, definirModalUpload] = useState(false);
  const [documentoPermissao, definirDocumentoPermissao] = useState<Documento | null>(null);
  const [titulo, definirTitulo] = useState('');
  const [visibilidade, definirVisibilidade] = useState<VisibilidadeDocumento>('ESPACO');
  const [metadados, definirMetadados] = useState('');
  const [arquivo, definirArquivo] = useState<File | null>(null);
  const [usuarioPermissao, definirUsuarioPermissao] = useState('');

  const documentos = useQuery({
    queryKey: ['documentos', espacoId],
    queryFn: () => servico.listarDocumentos(espacoId),
    refetchInterval: (consulta) =>
      consulta.state.data?.some((documento) => ['PENDENTE', 'PROCESSANDO'].includes(documento.estado))
        ? 2500
        : false,
  });
  const membros = useQuery({
    queryKey: ['membros', espacoId],
    queryFn: () => servico.listarMembros(espacoId),
  });

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return documentos.data ?? [];
    return (documentos.data ?? []).filter((documento) =>
      [documento.titulo, documento.nomeArquivo, documento.estado, documento.visibilidade]
        .some((valor) => valor.toLocaleLowerCase('pt-BR').includes(termo)),
    );
  }, [busca, documentos.data]);

  const enviar = useMutation({
    mutationFn: () => {
      if (!arquivo) throw new Error('Selecione um arquivo.');
      return servico.enviarDocumento(espacoId, {
        titulo: titulo.trim(),
        visibilidade,
        metadados: converterMetadados(metadados),
        arquivo,
      });
    },
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['documentos', espacoId] });
      notificar('Documento recebido e encaminhado para verificacao.', 'sucesso');
      fecharUpload();
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const reprocessar = useMutation({
    mutationFn: (documentoId: string) => servico.reprocessarDocumento(espacoId, documentoId),
    onSuccess: async () => {
      await clienteConsulta.invalidateQueries({ queryKey: ['documentos', espacoId] });
      notificar('Reprocessamento iniciado.', 'sucesso');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  const conceder = useMutation({
    mutationFn: () => {
      if (!documentoPermissao) throw new Error('Documento nao selecionado.');
      return servico.concederPermissaoDocumento(espacoId, documentoPermissao.id, usuarioPermissao.trim());
    },
    onSuccess: () => {
      notificar('Permissao de leitura concedida.', 'sucesso');
      definirDocumentoPermissao(null);
      definirUsuarioPermissao('');
    },
    onError: (erro) => notificar(mensagemDeErro(erro), 'erro'),
  });

  function fecharUpload() {
    definirModalUpload(false);
    definirTitulo('');
    definirMetadados('');
    definirArquivo(null);
    definirVisibilidade('ESPACO');
    if (seletorArquivo.current) seletorArquivo.current.value = '';
  }

  function selecionarArquivo(evento: ChangeEvent<HTMLInputElement>) {
    const selecionado = evento.target.files?.[0] ?? null;
    if (selecionado && selecionado.size > LIMITE_ARQUIVO) {
      notificar('O arquivo deve ter no maximo 10 MB.', 'erro');
      evento.target.value = '';
      return;
    }
    definirArquivo(selecionado);
    if (selecionado && !titulo) definirTitulo(selecionado.name.replace(/\.[^.]+$/, ''));
  }

  async function baixar(documento: Documento) {
    try {
      const blob = await servico.baixarDocumento(espacoId, documento.id);
      const endereco = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = endereco;
      link.download = documento.nomeArquivo;
      link.click();
      URL.revokeObjectURL(endereco);
      notificar('Download iniciado.', 'sucesso');
    } catch (erro) {
      notificar(mensagemDeErro(erro), 'erro');
    }
  }

  function submeterUpload(evento: FormEvent) {
    evento.preventDefault();
    if (!arquivo || titulo.trim().length < 3) {
      notificar('Informe um titulo e selecione um arquivo.', 'erro');
      return;
    }
    enviar.mutate();
  }

  return (
    <div className="page-container">
      <CabecalhoPagina
        titulo="Documentos"
        descricao="Gerencie as fontes verificadas que sustentam as respostas."
        acoes={<Botao variante="primario" icone={Plus} onClick={() => definirModalUpload(true)}>Enviar documento</Botao>}
      />

      <div className="toolbar">
        <label className="search-field">
          <Search size={17} aria-hidden="true" />
          <input value={busca} onChange={(evento) => definirBusca(evento.target.value)} placeholder="Buscar por titulo, arquivo ou estado" aria-label="Buscar documentos" />
        </label>
        <span className="toolbar-count">{listaFiltrada.length} de {documentos.data?.length ?? 0}</span>
      </div>

      {documentos.isLoading && <div className="loading-block"><span /><span /><span /></div>}
      {documentos.isError && <div className="error-banner" role="alert"><strong>Falha ao carregar documentos.</strong><button type="button" onClick={() => void documentos.refetch()}>Tentar novamente</button></div>}

      {!documentos.isLoading && documentos.data?.length === 0 && (
        <EstadoVazio
          icone={UploadCloud}
          titulo="Nenhuma fonte cadastrada"
          descricao="Envie PDF, texto, Markdown ou imagem para iniciar a base de conhecimento."
          acao={<Botao variante="primario" icone={Plus} onClick={() => definirModalUpload(true)}>Enviar documento</Botao>}
        />
      )}

      {listaFiltrada.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table document-table">
            <thead><tr><th>Documento</th><th>Seguranca</th><th>Processamento</th><th>Tamanho</th><th><span className="sr-only">Acoes</span></th></tr></thead>
            <tbody>
              {listaFiltrada.map((documento) => {
                const IconeArquivo = iconeDoArquivo(documento.tipoMime);
                return (
                  <tr key={documento.id}>
                    <td>
                      <div className="table-primary-cell">
                        <span className="document-icon"><IconeArquivo size={19} aria-hidden="true" /></span>
                        <div><strong>{documento.titulo}</strong><small>{documento.nomeArquivo} · versao {documento.versao}</small></div>
                      </div>
                    </td>
                    <td><div className="status-stack"><Status tom={documento.visibilidade === 'RESTRITO' ? 'informacao' : 'neutro'}>{documento.visibilidade}</Status><small><ShieldCheck size={13} aria-hidden="true" /> {documento.resultadoAntivirus}</small></div></td>
                    <td><div className="status-stack"><Status tom={tomDoEstado(documento.estado)}>{documento.estado}</Status><small>{documento.origemTexto ?? 'Aguardando extracao'} · {formatarData(documento.processadoEm)}</small>{documento.erroProcessamento && <span className="cell-error">{documento.erroProcessamento}</span>}</div></td>
                    <td><strong className="numeric-cell">{formatarBytes(documento.tamanhoBytes)}</strong></td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-button" type="button" onClick={() => void baixar(documento)} aria-label={`Baixar ${documento.titulo}`} title="Baixar original" disabled={documento.estado !== 'PRONTO'}><Download size={17} aria-hidden="true" /></button>
                        {documento.visibilidade === 'RESTRITO' && <button className="icon-button" type="button" onClick={() => definirDocumentoPermissao(documento)} aria-label={`Conceder permissao em ${documento.titulo}`} title="Conceder leitura"><UserPlus size={17} aria-hidden="true" /></button>}
                        {documento.estado === 'FALHOU' && <button className="icon-button" type="button" onClick={() => reprocessar.mutate(documento.id)} aria-label={`Reprocessar ${documento.titulo}`} title="Reprocessar"><RefreshCw size={17} aria-hidden="true" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal aberto={modalUpload} titulo="Enviar documento" descricao="O arquivo sera verificado antes de entrar na busca." aoFechar={fecharUpload}>
        <form className="form-stack" onSubmit={submeterUpload}>
          <label>
            <span>Arquivo</span>
            <input ref={seletorArquivo} className="file-input" type="file" accept=".pdf,.txt,.md,.png,.jpg,.jpeg,application/pdf,text/plain,text/markdown,image/png,image/jpeg" onChange={selecionarArquivo} required />
          </label>
          {arquivo && <div className="selected-file"><FileText size={18} aria-hidden="true" /><div><strong>{arquivo.name}</strong><small>{formatarBytes(arquivo.size)}</small></div></div>}
          <label><span>Titulo</span><input value={titulo} onChange={(evento) => definirTitulo(evento.target.value)} maxLength={180} required /></label>
          <fieldset className="segmented-field">
            <legend>Visibilidade</legend>
            <label><input type="radio" name="visibilidade" value="ESPACO" checked={visibilidade === 'ESPACO'} onChange={() => definirVisibilidade('ESPACO')} /><span>Todo o espaco</span></label>
            <label><input type="radio" name="visibilidade" value="RESTRITO" checked={visibilidade === 'RESTRITO'} onChange={() => definirVisibilidade('RESTRITO')} /><span>Restrito</span></label>
          </fieldset>
          <label><span>Metadados <small>opcional</small></span><input value={metadados} onChange={(evento) => definirMetadados(evento.target.value)} placeholder="departamento=financeiro, tipo=politica" /></label>
          <div className="modal-actions"><Botao type="button" onClick={fecharUpload}>Cancelar</Botao><Botao type="submit" variante="primario" icone={UploadCloud} carregando={enviar.isPending}>Enviar e verificar</Botao></div>
        </form>
      </Modal>

      <Modal aberto={Boolean(documentoPermissao)} titulo="Conceder leitura" descricao={documentoPermissao?.titulo} aoFechar={() => definirDocumentoPermissao(null)}>
        <form className="form-stack" onSubmit={(evento) => { evento.preventDefault(); conceder.mutate(); }}>
          <label><span>Membro do espaco</span><select value={usuarioPermissao} onChange={(evento) => definirUsuarioPermissao(evento.target.value)} required><option value="">Selecione um membro</option>{membros.data?.map((membro) => <option value={membro.usuarioId} key={membro.usuarioId}>{membro.usuarioId} · {membro.papel}</option>)}</select></label>
          <div className="permission-note"><ShieldCheck size={18} aria-hidden="true" /><p>Esta permissao libera somente a leitura deste documento restrito.</p></div>
          <div className="modal-actions"><Botao type="button" onClick={() => definirDocumentoPermissao(null)}>Cancelar</Botao><Botao type="submit" variante="primario" icone={UserPlus} carregando={conceder.isPending}>Conceder leitura</Botao></div>
        </form>
      </Modal>
    </div>
  );
}
