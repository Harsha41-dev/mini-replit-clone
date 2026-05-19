import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const frontendRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    root: frontendRoot,
    build: {
        outDir: path.resolve(frontendRoot, '../public'),
        emptyOutDir: true
    },
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3001',
            '/vendor': 'http://localhost:3001'
        }
    }
});
