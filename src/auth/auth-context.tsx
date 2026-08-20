import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { configuracao } from '../lib/config';

const gerenciador = new UserManager({
  authority: configuracao.autoridadeOidc,
  client_id: configuracao.clienteOidc,
  redirect_uri: `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: `${window.location.origin}/login`,
  response_type: 'code',
  scope: configuracao.escopoOidc,
  automaticSilentRenew: true,
  monitorSession: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
});

interface EstadoAutenticacao {
  usuario: User | null;
  carregando: boolean;
  autenticado: boolean;
  entrar: () => Promise<void>;
  sair: () => Promise<void>;
  processarRetorno: () => Promise<User>;
  obterToken: () => Promise<string | null>;
}

const ContextoAutenticacao = createContext<EstadoAutenticacao | null>(null);

export function ProvedorAutenticacao({ children }: PropsWithChildren) {
  const [usuario, definirUsuario] = useState<User | null>(null);
  const [carregando, definirCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    gerenciador
      .getUser()
      .then((sessao) => {
        if (ativo) definirUsuario(sessao?.expired ? null : sessao);
      })
      .finally(() => {
        if (ativo) definirCarregando(false);
      });

    const atualizar = (sessao: User) => definirUsuario(sessao);
    const remover = () => definirUsuario(null);
    gerenciador.events.addUserLoaded(atualizar);
    gerenciador.events.addUserUnloaded(remover);
    gerenciador.events.addAccessTokenExpired(remover);

    return () => {
      ativo = false;
      gerenciador.events.removeUserLoaded(atualizar);
      gerenciador.events.removeUserUnloaded(remover);
      gerenciador.events.removeAccessTokenExpired(remover);
    };
  }, []);

  const entrar = useCallback(async () => {
    await gerenciador.signinRedirect({ state: { caminho: window.location.pathname } });
  }, []);

  const sair = useCallback(async () => {
    await gerenciador.signoutRedirect({ id_token_hint: usuario?.id_token });
  }, [usuario]);

  const processarRetorno = useCallback(async () => {
    const sessao = await gerenciador.signinRedirectCallback();
    definirUsuario(sessao);
    definirCarregando(false);
    return sessao;
  }, []);

  const obterToken = useCallback(async () => {
    let sessao = await gerenciador.getUser();
    if (sessao?.expired) {
      try {
        sessao = await gerenciador.signinSilent();
      } catch {
        definirUsuario(null);
        return null;
      }
    }
    return sessao?.access_token ?? null;
  }, []);

  const valor = useMemo<EstadoAutenticacao>(
    () => ({
      usuario,
      carregando,
      autenticado: Boolean(usuario && !usuario.expired),
      entrar,
      sair,
      processarRetorno,
      obterToken,
    }),
    [usuario, carregando, entrar, sair, processarRetorno, obterToken],
  );

  return <ContextoAutenticacao.Provider value={valor}>{children}</ContextoAutenticacao.Provider>;
}

export function useAutenticacao() {
  const contexto = useContext(ContextoAutenticacao);
  if (!contexto) throw new Error('useAutenticacao deve ser usado dentro do ProvedorAutenticacao.');
  return contexto;
}
