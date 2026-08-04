import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import './index.css';
import { worker } from './mocks/browser';
import App from './App';

// Pitfall 4: MSW must start BEFORE React renders
worker.start({ onUnhandledRequest: 'bypass' }).then(
  () => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  },
  (err) => {
    console.error('MSW worker failed to start:', err);
    // Graceful degradation — render without mocking
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
);
