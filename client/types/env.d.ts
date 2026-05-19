import type { User } from "./user";

declare global {
    const __BUILD_VERSION__: string;

    const grecaptcha: {
        ready(cb: () => void): void;
        execute(siteKey: string, opts: { action: string }): Promise<string>;
    };

    interface Window {
        user?: User & { admin?: boolean };
        authToken?: string;
        cardImageVersion?: string;
    }

    interface ImportMetaEnv {
        readonly DEV: boolean;
        readonly PROD: boolean;
        readonly MODE: string;
        readonly [key: string]: any;
    }

    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

declare module "emoji-js" {
    export default class EmojiConvertor {
        replace_colons(str: string): string;
        replace_emoticons(str: string): string;
        replace_emoticons_with_colons(str: string): string;
        replace_unified(str: string): string;
        [key: string]: any;
    }
}

export {};
