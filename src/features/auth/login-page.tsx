import { ArrowRight, CheckCircle2, KeyRound, LockKeyhole } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAutenticacao } from '../../auth/auth-context';
import { Botao } from '../../components/ui/button';
import { Logo } from '../../components/layout/logo';

export function PaginaAcesso() {
  const { entrar, autenticado, carregando } = useAutenticacao();
  const localizacao = useLocation();
  const origem = (localizacao.state as { origem?: string } | null)?.origem;

  if (autenticado) return <Navigate to={origem ?? '/espacos'} replace />;

  return (
    <main className="login-page">
      <header className="login-header"><Logo /></header>
      <section className="login-stage">
        <div className="login-identity">
          <span className="login-symbol"><LockKeyhole size={29} aria-hidden="true" /></span>
          <p className="eyebrow">Conhecimento corporativo protegido</p>
          <h1>Assistente de Conhecimento</h1>
          <p className="login-lead">
            Consulte documentos internos e receba respostas objetivas, sempre acompanhadas das fontes autorizadas.
          </p>
          <ul className="login-trust-list" aria-label="Garantias da plataforma">
            <li><CheckCircle2 size={17} aria-hidden="true" /> Acesso controlado por espaco e documento</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Respostas rastreaveis e verificaveis</li>
            <li><CheckCircle2 size={17} aria-hidden="true" /> Arquivos verificados antes da indexacao</li>
          </ul>
        </div>

        <div className="login-action-panel">
          <KeyRound size={24} aria-hidden="true" />
          <h2>Acesse sua organizacao</h2>
          <p>O login e protegido pelo provedor de identidade da empresa.</p>
          <Botao variante="primario" onClick={() => void entrar()} carregando={carregando} icone={ArrowRight}>
            Continuar com Keycloak
          </Botao>
          <div className="demo-access">
            <span>Ambiente local</span>
            <code>ana</code><code>context123</code>
          </div>
        </div>
      </section>
      <footer className="login-footer">
        <span>OAuth2 / OpenID Connect com PKCE</span>
        <span>Dados isolados por permissao</span>
      </footer>
    </main>
  );
}
