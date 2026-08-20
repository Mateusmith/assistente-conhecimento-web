import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAutenticacao } from './auth-context';

export function RotaProtegida() {
  const { autenticado, carregando } = useAutenticacao();
  const localizacao = useLocation();

  if (carregando) {
    return (
      <main className="auth-status-page" aria-live="polite">
        <LoaderCircle className="spin" size={28} aria-hidden="true" />
        <h1>Preparando seu espaco</h1>
        <p>Recuperando a sessao protegida.</p>
      </main>
    );
  }

  if (!autenticado) return <Navigate to="/login" state={{ origem: localizacao.pathname }} replace />;
  return <Outlet />;
}
