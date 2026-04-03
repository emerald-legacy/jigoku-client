import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
    plugins: [
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler']
            }
        })
    ],
    root: __dirname,
    publicDir: false,
    build: {
        outDir: 'public',
        manifest: true,
        rollupOptions: {
            input: 'client/index.jsx',
            output: {
                assetFileNames: 'assets/[name].[hash].[ext]',
                chunkFileNames: 'assets/[name].[hash].js',
                entryFileNames: 'assets/[name].[hash].js',
                manualChunks(id) {
                    if(id.includes('node_modules')) {
                        return 'vendor';
                    }
                }
            }
        },
        emptyOutDir: false,
        sourcemap: true
    },
    define: {
        '__BUILD_VERSION__': JSON.stringify(process.env.BUILD_VERSION || 'LOCAL')
    },
    resolve: {
        extensions: ['.js', '.jsx', '.json']
    },
    optimizeDeps: {
        include: ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit']
    }
});
