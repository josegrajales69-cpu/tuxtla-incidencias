import {PhotoViewerProvider} from './components/PhotoViewer';
import { ThemeProvider } from './components/Theme';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './landing.css';

const originalFetch=window.fetch.bind(window);
window.fetch=async(...args:Parameters<typeof fetch>)=>{const response=await originalFetch(...args);const url=typeof args[0]==='string'?args[0]:'';if(response.status===401&&url.startsWith('/api/')&&!url.endsWith('/login'))window.dispatchEvent(new Event('tuxtla-session-expired'));return response;};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider><PhotoViewerProvider><App /></PhotoViewerProvider></ThemeProvider>
  </React.StrictMode>,
);
