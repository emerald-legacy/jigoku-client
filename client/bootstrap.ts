import type { User } from "./types/user";

interface BootstrapData {
    user?: User & { admin?: boolean };
    token?: string;
    cardImageVersion?: string;
}

function read(): BootstrapData {
    if(typeof document === "undefined") {
        return {};
    }
    const el = document.getElementById("bootstrap");
    if(!el?.dataset.bootstrap) {
        return {};
    }
    try {
        return JSON.parse(el.dataset.bootstrap);
    } catch(_e) {
        return {};
    }
}

const bootstrap: BootstrapData = read();
export default bootstrap;
