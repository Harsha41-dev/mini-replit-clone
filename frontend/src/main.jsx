import React from 'react';
import { createRoot } from 'react-dom/client';
import { loader } from '@monaco-editor/react';
import { App } from './App';
import './styles.css';

loader.config({
    paths: {
        vs: '/vendor/monaco/vs'
    }
});

createRoot(document.getElementById('root')).render(<App />);
