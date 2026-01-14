import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Create component container
const container = document.createElement('div');
container.id = 'component';
document.body.appendChild(container);

// Mock jQuery
const mockJquery = vi.fn(() => ({
    scrollTop: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    Deferred: () => {
        let resolveCallback, rejectCallback;
        const deferred = {
            resolve: (data) => { if (resolveCallback) { resolveCallback(data); } return deferred; },
            reject: (data) => { if (rejectCallback) { rejectCallback(data); } return deferred; },
            promise: () => ({
                then: (resolve, reject) => {
                    resolveCallback = resolve;
                    rejectCallback = reject;
                    return deferred.promise();
                }
            })
        };
        return deferred;
    },
    post: vi.fn(),
    ajax: vi.fn()
}));

mockJquery.fn = { jquery: '3.6.0' };
mockJquery.Deferred = mockJquery().Deferred;
mockJquery.post = vi.fn();
mockJquery.ajax = vi.fn();

global.$ = mockJquery;
global.jQuery = mockJquery;

// Mock global variables that might be set by the server
global.user = undefined;
global.authToken = undefined;
