import type { ReactNode } from 'react';

interface PropriedadesCabecalho {
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}

export function CabecalhoPagina({ titulo, descricao, acoes }: PropriedadesCabecalho) {
  return (
    <header className="page-header">
      <div>
        <h1>{titulo}</h1>
        {descricao && <p>{descricao}</p>}
      </div>
      {acoes && <div className="page-actions">{acoes}</div>}
    </header>
  );
}
