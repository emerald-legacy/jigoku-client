export function receiveUsers(users: any[]) {
    return {
        type: "RECEIVE_USERS" as const,
        users: users
    };
}
