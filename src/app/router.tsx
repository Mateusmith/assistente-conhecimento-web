import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RetornoAutenticacao } from '../auth/auth-callback';
import { RotaProtegida } from '../auth/protected-route';
import { EstruturaAplicacao } from '../components/layout/app-shell';
import { PaginaAcesso } from '../features/auth/login-page';
import { ProvedorServico } from './service-context';

const PaginaAdministracao = lazy(() => import('../features/administration/administration-page').then((modulo) => ({ default: modulo.PaginaAdministracao })));
const PaginaAvaliacoes = lazy(() => import('../features/evaluations/evaluations-page').then((modulo) => ({ default: modulo.PaginaAvaliacoes })));
const PaginaConversas = lazy(() => import('../features/conversations/conversations-page').then((modulo) => ({ default: modulo.PaginaConversas })));
const PaginaDocumentos = lazy(() => import('../features/documents/documents-page').then((modulo) => ({ default: modulo.PaginaDocumentos })));
const PaginaVisaoGeral = lazy(() => import('../features/overview/overview-page').then((modulo) => ({ default: modulo.PaginaVisaoGeral })));
const PaginaPrivacidade = lazy(() => import('../features/privacy/privacy-page').then((modulo) => ({ default: modulo.PaginaPrivacidade })));
const PaginaEspacos = lazy(() => import('../features/spaces/spaces-page').then((modulo) => ({ default: modulo.PaginaEspacos })));

function carregar(elemento: ReactNode) {
  return <Suspense fallback={<div className="route-loading" aria-label="Carregando pagina"><span /></div>}>{elemento}</Suspense>;
}

function AplicacaoProtegida() {
  return (
    <ProvedorServico>
      <EstruturaAplicacao />
    </ProvedorServico>
  );
}

export const roteador = createBrowserRouter([
  { path: '/login', element: <PaginaAcesso /> },
  { path: '/auth/callback', element: <RetornoAutenticacao /> },
  {
    element: <RotaProtegida />,
    children: [
      {
        element: <AplicacaoProtegida />,
        children: [
          { index: true, element: <Navigate to="/espacos" replace /> },
          { path: 'espacos', element: carregar(<PaginaEspacos />) },
          { path: 'espacos/:espacoId', element: carregar(<PaginaVisaoGeral />) },
          { path: 'espacos/:espacoId/conversas', element: carregar(<PaginaConversas />) },
          { path: 'espacos/:espacoId/conversas/:conversaId', element: carregar(<PaginaConversas />) },
          { path: 'espacos/:espacoId/documentos', element: carregar(<PaginaDocumentos />) },
          { path: 'espacos/:espacoId/avaliacoes', element: carregar(<PaginaAvaliacoes />) },
          { path: 'espacos/:espacoId/administracao', element: carregar(<PaginaAdministracao />) },
          { path: 'privacidade', element: carregar(<PaginaPrivacidade />) },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
