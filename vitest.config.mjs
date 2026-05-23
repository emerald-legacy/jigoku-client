import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    test: {
        globals: true,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['client/**/*.{js,jsx,ts,tsx}', 'server/**/*.ts']
        },
        projects: [
            {
                plugins: [react()],
                resolve: {
                    alias: {
                        '@': path.resolve(__dirname, 'client')
                    }
                },
                test: {
                    name: 'client',
                    globals: true,
                    environment: 'jsdom',
                    setupFiles: ['./test/client/setup.ts'],
                    include: ['test/client/**/*.spec.{js,jsx,ts,tsx}']
                }
            },
            {
                test: {
                    name: 'server',
                    globals: true,
                    environment: 'node',
                    include: ['test/server/**/*.spec.{js,ts}']
                }
            }
        ]
    }
});
