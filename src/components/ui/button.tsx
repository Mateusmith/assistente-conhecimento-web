import { LoaderCircle, type LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface PropriedadesBotao extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'secundario' | 'perigo' | 'fantasma';
  icone?: LucideIcon;
  carregando?: boolean;
}

export function Botao({
  variante = 'secundario',
  icone: Icone,
  carregando = false,
  children,
  className = '',
  disabled,
  ...propriedades
}: PropriedadesBotao) {
  return (
    <button
      className={`button button-${variante} ${className}`}
      disabled={disabled || carregando}
      {...propriedades}
    >
      {carregando ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : Icone ? <Icone size={17} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
