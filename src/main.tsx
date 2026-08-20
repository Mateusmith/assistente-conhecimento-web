import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { Provedores } from './app/providers';
import { roteador } from './app/router';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provedores>
      <RouterProvider router={roteador} />
    </Provedores>
  </StrictMode>,
);
