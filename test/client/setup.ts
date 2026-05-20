import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Create component container
const container = document.createElement("div");
container.id = "component";
document.body.appendChild(container);

// Mock global variables that might be set by the server
global.user = undefined;
global.authToken = undefined;

// Vite-defined globals (see vite.config.mjs `define`); tests run without that define plugin.
(globalThis as any).__BUILD_VERSION__ = "test-build";
