export function register(user: any, token: string) {
    return {
        type: "AUTH_REGISTER" as const,
        user: user,
        token: token
    };
}

export function login(user: any, token: string, isAdmin: boolean) {
    return {
        type: "AUTH_LOGIN" as const,
        user: user,
        token: token,
        isAdmin: isAdmin
    };
}

export function logout() {
    return {
        type: "AUTH_LOGOUT" as const
    };
}
