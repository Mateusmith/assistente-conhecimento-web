import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAutenticacao } from './auth-context';

export function RetornoAutenticacao() {
  const { processarRetorno, autenticado } = useAutenticacao();
  const navegar = useNavigate();
  const iniciou = useRef(false);
  const [erro, definirErro] = useState<string | null>(null);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    processarRetorno()
      .then((usuario) => {
        const estado = usuario.state as { caminho?: string } | undefined;
        navegar(estado?.caminho && estado.caminho !== '/login' ? estado.caminho : '/espacos', {
          replace: true,
        });
      })
      .catch(() => definirErro('Nao foi possivel concluir sua autenticacao.'));
  }, [navegar, processarRetorno]);

  if (autenticado) return <Navigate to="/espacos" replace />;

  return (
    <main className="auth-status-page">
      <LoaderCircle className="spin" size={28} aria-hidden="true" />
      <h1>{erro ? 'Falha na autenticacao' : 'Validando acesso'}</h1>
      <p>{erro ?? 'Estamos confirmando sua identidade com seguranca.'}</p>
      {erro && (
        <button className="button button-primary" type="button" onClick={() => navegar('/login')}>
          Voltar para o acesso
        </button>
      )}
    </main>
  );
}
