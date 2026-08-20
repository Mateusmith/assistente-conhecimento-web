import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

type TipoNotificacao = 'sucesso' | 'erro' | 'informacao';

interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  mensagem: string;
}

interface ContextoNotificacao {
  notificar: (mensagem: string, tipo?: TipoNotificacao) => void;
}

const Contexto = createContext<ContextoNotificacao | null>(null);

export function ProvedorNotificacao({ children }: PropsWithChildren) {
  const [notificacoes, definirNotificacoes] = useState<Notificacao[]>([]);

  const remover = useCallback((id: string) => {
    definirNotificacoes((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

  const notificar = useCallback(
    (mensagem: string, tipo: TipoNotificacao = 'informacao') => {
      const id = crypto.randomUUID();
      definirNotificacoes((atuais) => [...atuais, { id, mensagem, tipo }].slice(-4));
      window.setTimeout(() => remover(id), 5000);
    },
    [remover],
  );

  const valor = useMemo(() => ({ notificar }), [notificar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {notificacoes.map((item) => {
          const Icone = item.tipo === 'sucesso' ? CheckCircle2 : item.tipo === 'erro' ? CircleAlert : Info;
          return (
            <div className={`toast toast-${item.tipo}`} key={item.id} role="status">
              <Icone size={18} aria-hidden="true" />
              <span>{item.mensagem}</span>
              <button type="button" onClick={() => remover(item.id)} aria-label="Fechar notificacao">
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </Contexto.Provider>
  );
}

export function useNotificacao() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useNotificacao deve ser usado dentro do ProvedorNotificacao.');
  return contexto;
}
