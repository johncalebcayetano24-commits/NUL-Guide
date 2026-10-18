import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/inter/latin-700.css';
import '@fontsource/inter/latin-800.css';
import '@fontsource/montserrat/latin-700.css';
import '@fontsource/montserrat/latin-900.css';
import '@fontsource/fraunces/latin-400.css';
import '@fontsource/fraunces/latin-600.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import { AppProvider } from './state/AppContext';
import App from './App';

createRoot(document.getElementById('root')).render(<React.StrictMode><BrowserRouter><AppProvider><App /></AppProvider></BrowserRouter></React.StrictMode>);
