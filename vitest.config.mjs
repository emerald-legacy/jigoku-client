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
        setupFiles: ['./test/client/setup.ts'],
        include: ['test/client/**/*.spec.{js,jsx,ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['client/**/*.{js,jsx,ts,tsx}']
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'client')
        }
    }
});
