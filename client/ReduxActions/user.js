import axios from "axios";

export function refreshUser(user, token) {
    return {
        type: "REFRESH_USER",
        user: user,
        token: token
    };
}

export function loadBlockList(user) {
    return {
        types: ["REQUEST_BLOCKLIST", "RECEIVE_BLOCKLIST"],
        shouldCallAPI: () => true,
        callAPI: () => {
            return axios.get(`/api/account/${user.username}/blocklist`).then(response => response.data);
        }
    };
}

export function addBlockListEntry(user, username) {
    return {
        types: ["ADD_BLOCKLIST", "BLOCKLIST_ADDED"],
        shouldCallAPI: () => true,
        callAPI: () => axios.post(`/api/account/${user.username}/blocklist`, {
            username: username
        }).then(response => response.data)
    };
}

export function removeBlockListEntry(user, username) {
    return {
        types: ["DELETE_BLOCKLIST", "BLOCKLIST_DELETED"],
        shouldCallAPI: () => true,
        callAPI: () => axios.delete(`/api/account/${user.username}/blocklist/${username}`)
            .then(response => response.data)
    };
}

export function clearBlockListStatus() {
    return {
        type: "CLEAR_BLOCKLIST_STATUS"
    };
}
