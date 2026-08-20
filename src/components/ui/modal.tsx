import { X } from 'lucide-react';
import { useEffect, type PropsWithChildren } from 'react';

interface PropriedadesModal extends PropsWithChildren {
  aberto: boolean;
  titulo: string;
  descricao?: string;
  aoFechar: () => void;
  largura?: 'normal' | 'larga';
}

export function Modal({ aberto, titulo, descricao, aoFechar, largura = 'normal', children }: PropriedadesModal) {
  useEffect(() => {
    if (!aberto) return;
    const aoPressionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar();
    };
    document.addEventListener('keydown', aoPressionar);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', aoPressionar);
      document.body.classList.remove('modal-open');
    };
  }, [aberto, aoFechar]);

  if (!aberto) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(evento) => {
      if (evento.target === evento.currentTarget) aoFechar();
    }}>
      <section className={`modal-dialog modal-${largura}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{titulo}</h2>
            {descricao && <p>{descricao}</p>}
          </div>
          <button className="icon-button" type="button" onClick={aoFechar} aria-label="Fechar janela">
            <X size={19} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}
