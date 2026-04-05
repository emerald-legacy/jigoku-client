import axios from "axios";

export function refreshUser(user: any, token: string) {
    return {
        type: "REFRESH_USER" as const,
        user: user,
        token: token
    };
}

export function loadBlockList(user: any) {
    return {
        types: ["REQUEST_BLOCKLIST", "RECEIVE_BLOCKLIST"] as const,
        shouldCallAPI: () => true,
        callAPI: () => {
            return axios.get(`/api/account/${user.username}/blocklist`).then(response => response.data);
        }
    };
}

export function addBlockListEntry(user: any, username: string) {
    return {
        types: ["ADD_BLOCKLIST", "BLOCKLIST_ADDED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.post(`/api/account/${user.username}/blocklist`, {
            username: username
        }).then(response => response.data)
    };
}

export function removeBlockListEntry(user: any, username: string) {
    return {
        types: ["DELETE_BLOCKLIST", "BLOCKLIST_DELETED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.delete(`/api/account/${user.username}/blocklist/${username}`)
            .then(response => response.data)
    };
}

export function clearBlockListStatus() {
    return {
        type: "CLEAR_BLOCKLIST_STATUS" as const
    };
}
