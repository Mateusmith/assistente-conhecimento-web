import type { ErroApiResposta } from '../types/api';

export class ErroDaApi extends Error {
  readonly status: number;
  readonly codigo: string;
  readonly campos: ErroApiResposta['campos'];

  constructor(status: number, resposta: ErroApiResposta) {
    super(resposta.mensagem ?? `A requisicao falhou com status ${status}.`);
    this.name = 'ErroDaApi';
    this.status = status;
    this.codigo = resposta.codigo ?? 'ERRO_NAO_IDENTIFICADO';
    this.campos = resposta.campos;
  }
}

type ObterToken = () => Promise<string | null>;

export interface OpcoesRequisicao extends Omit<RequestInit, 'body'> {
  corpo?: BodyInit | Record<string, unknown> | null;
  autenticada?: boolean;
}

export class ClienteApi {
  constructor(
    private readonly urlBase: string,
    private readonly obterToken: ObterToken,
  ) {}

  async requisitar<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
    const resposta = await this.executar(caminho, opcoes);
    if (resposta.status === 204) return undefined as T;
    return (await resposta.json()) as T;
  }

  async baixar(caminho: string): Promise<Blob> {
    const resposta = await this.executar(caminho, { method: 'GET' });
    return resposta.blob();
  }

  async abrirFluxo(caminho: string, opcoes: OpcoesRequisicao): Promise<Response> {
    return this.executar(caminho, opcoes);
  }

  private async executar(caminho: string, opcoes: OpcoesRequisicao): Promise<Response> {
    const { corpo, autenticada = true, headers: cabecalhosRecebidos, ...restante } = opcoes;
    const cabecalhos = new Headers(cabecalhosRecebidos);

    if (autenticada) {
      const token = await this.obterToken();
      if (!token) throw new ErroDaApi(401, { codigo: 'SESSAO_EXPIRADA', mensagem: 'Sua sessao expirou.' });
      cabecalhos.set('Authorization', `Bearer ${token}`);
    }

    let body: BodyInit | null | undefined = corpo as BodyInit | null | undefined;
    const corpoEhObjeto = corpo !== null && typeof corpo === 'object' && !(corpo instanceof FormData) &&
      !(corpo instanceof Blob) && !(corpo instanceof URLSearchParams) && !(corpo instanceof ArrayBuffer);

    if (corpoEhObjeto) {
      cabecalhos.set('Content-Type', 'application/json');
      body = JSON.stringify(corpo);
    }

    const resposta = await fetch(`${this.urlBase}${caminho}`, {
      ...restante,
      body,
      headers: cabecalhos,
    });

    if (!resposta.ok) {
      const conteudo = await resposta.text();
      let erro: ErroApiResposta;
      try {
        erro = JSON.parse(conteudo) as ErroApiResposta;
      } catch {
        erro = {
          mensagem: resposta.statusText || 'Nao foi possivel concluir a requisicao.',
        };
      }
      throw new ErroDaApi(resposta.status, erro);
    }

    return resposta;
  }
}

export function mensagemDeErro(erro: unknown): string {
  if (erro instanceof ErroDaApi || erro instanceof Error) return erro.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}
