import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <a className="skip" href="#conteudo">Ir para o conteúdo</a>
    <header className="masthead">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">◫</span>
        <span>Plano de leitura</span>
      </div>
      <span className="collection">Coleção de estudo bíblico</span>
    </header>
    <main id="conteudo" tabIndex={-1}>
      <div className="intro">
        <h1>Plano de leitura</h1>
        <nav className="atalhos" aria-label="Seções desta página">
          <a href="#leitura">Leitura do dia</a>
          <a href="#historico">Histórico</a>
          <a href="#backup">Backup</a>
        </nav>
      </div>
      <App />
    </main>
  </StrictMode>,
);
