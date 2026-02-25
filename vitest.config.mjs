import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./test/client/setup.js'],
        include: ['test/client/**/*.spec.{js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['client/**/*.{js,jsx}'],
            exclude: ['client/DevTools.jsx']
        },
        server: {
            deps: {
                inline: ['jquery-migrate', 'jquery-nearest']
            }
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'client'),
            'jquery-migrate': path.resolve(__dirname, 'test/client/__mocks__/jquery-migrate.js'),
            'jquery-nearest': path.resolve(__dirname, 'test/client/__mocks__/jquery-nearest.js')
        }
    }
});
