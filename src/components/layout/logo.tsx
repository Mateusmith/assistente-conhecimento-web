import { LibraryBig } from 'lucide-react';

interface PropriedadesLogo {
  compacto?: boolean;
}

export function Logo({ compacto = false }: PropriedadesLogo) {
  return (
    <div className="brand" aria-label="Assistente de Conhecimento">
      <span className="brand-mark"><LibraryBig size={21} strokeWidth={2.2} aria-hidden="true" /></span>
      {!compacto && (
        <span className="brand-copy">
          <strong>Assistente</strong>
          <small>de Conhecimento</small>
        </span>
      )}
    </div>
  );
}
