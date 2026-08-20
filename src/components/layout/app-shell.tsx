import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  BookOpenText,
  Bot,
  ChevronDown,
  FileText,
  Gauge,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useServico } from '../../app/service-context';
import { useAutenticacao } from '../../auth/auth-context';
import { iniciais } from '../../lib/formatters';
import { Logo } from './logo';

const itensNavegacao = [
  { caminho: '', rotulo: 'Visao geral', icone: Gauge, fim: true },
  { caminho: 'conversas', rotulo: 'Conversas', icone: Bot },
  { caminho: 'documentos', rotulo: 'Documentos', icone: FileText },
  { caminho: 'avaliacoes', rotulo: 'Avaliacoes', icone: BarChart3 },
  { caminho: 'administracao', rotulo: 'Administracao', icone: Settings2 },
];

export function EstruturaAplicacao() {
  const { espacoId } = useParams();
  const localizacao = useLocation();
  const navegar = useNavigate();
  const servico = useServico();
  const { usuario, sair } = useAutenticacao();
  const [menuAberto, definirMenuAberto] = useState(false);
  const { data: espacos = [] } = useQuery({
    queryKey: ['espacos'],
    queryFn: () => servico.listarEspacos(),
  });

  const nomeUsuario =
    (usuario?.profile.name as string | undefined) ??
    (usuario?.profile.preferred_username as string | undefined) ??
    'Usuario';
  const email = (usuario?.profile.email as string | undefined) ?? '';

  const fecharMenu = () => definirMenuAberto(false);
  const baseEspaco = espacoId ? `/espacos/${espacoId}` : '';

  return (
    <div className="app-shell">
      <a className="skip-link" href="#conteudo-principal">Ir para o conteudo</a>
      <div className={`sidebar-backdrop ${menuAberto ? 'visible' : ''}`} onClick={fecharMenu} />
      <aside className={`sidebar ${menuAberto ? 'open' : ''}`} aria-label="Navegacao principal">
        <div className="sidebar-top">
          <Logo />
          <button className="icon-button sidebar-close" type="button" onClick={fecharMenu} aria-label="Fechar menu">
            <X size={19} aria-hidden="true" />
          </button>
        </div>

        <label className="space-selector-label" htmlFor="space-selector">Espaco atual</label>
        <div className="space-selector-wrap">
          <BookOpenText size={17} aria-hidden="true" />
          <select
            id="space-selector"
            value={espacoId ?? ''}
            onChange={(evento) => {
              const selecionado = evento.target.value;
              navegar(selecionado ? `/espacos/${selecionado}` : '/espacos');
              fecharMenu();
            }}
          >
            <option value="">Selecionar espaco</option>
            {espacos.map((espaco) => <option value={espaco.id} key={espaco.id}>{espaco.nome}</option>)}
          </select>
          <ChevronDown size={15} aria-hidden="true" />
        </div>

        <nav className="sidebar-nav">
          {espacoId && itensNavegacao.map(({ caminho, rotulo, icone: Icone, fim }) => (
            <NavLink
              key={caminho}
              to={`${baseEspaco}${caminho ? `/${caminho}` : ''}`}
              end={fim}
              onClick={fecharMenu}
            >
              <Icone size={18} aria-hidden="true" />
              <span>{rotulo}</span>
            </NavLink>
          ))}
          <NavLink to="/privacidade" onClick={fecharMenu}>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Meus dados</span>
          </NavLink>
        </nav>

        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">{iniciais(nomeUsuario)}</span>
          <div className="user-copy">
            <strong>{nomeUsuario}</strong>
            <small>{email || 'Sessao protegida'}</small>
          </div>
          <button className="icon-button icon-on-dark" type="button" onClick={() => void sair()} aria-label="Sair da conta" title="Sair">
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="mobile-header">
          <button className="icon-button" type="button" onClick={() => definirMenuAberto(true)} aria-label="Abrir menu">
            <Menu size={20} aria-hidden="true" />
          </button>
          <Logo compacto />
          <span className="avatar avatar-small" aria-hidden="true">{iniciais(nomeUsuario)}</span>
        </header>
        <main id="conteudo-principal" className={localizacao.pathname.includes('/conversas') ? 'main-content chat-content' : 'main-content'}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
