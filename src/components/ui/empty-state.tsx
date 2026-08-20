import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PropriedadesVazio {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  acao?: ReactNode;
}

export function EstadoVazio({ icone: Icone, titulo, descricao, acao }: PropriedadesVazio) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icone size={23} aria-hidden="true" /></span>
      <h3>{titulo}</h3>
      <p>{descricao}</p>
      {acao}
    </div>
  );
}
