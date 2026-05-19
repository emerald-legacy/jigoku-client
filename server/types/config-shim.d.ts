declare module "config" {
    interface AppConfig {
        env: string;
        dbPath: string;
        lobbyWsUrl: string;
        domain: string;
        https: boolean | string;
        secret: string;
        nodeSecret: string;
        captchaKey: string;
        hmacSecret: string;
        emailPath: string | object;
        cookieLifetime: number;
        cspConnectSources: string[];
        "lobby.port": number | string;
        "gameNode.name": string;
        "gameNode.host": string;
        "gameNode.socketioPort": number | string;
    }
    interface ConfigClass {
        get<K extends keyof AppConfig>(property: K): AppConfig[K];
        has<K extends keyof AppConfig>(property: K): boolean;
    }
    const config: ConfigClass;
    export default config;
}
