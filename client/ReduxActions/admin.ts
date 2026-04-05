import axios from "axios";

export function findUser(username: string) {
    return {
        types: ["REQUEST_FINDUSER", "RECEIVE_FINDUSER"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.get(`/api/user/${username}`).then(response => response.data)
    };
}

export function saveUser(user: any) {
    return {
        types: ["SAVE_USER", "USER_SAVED"] as const,
        shouldCallAPI: () => true,
        callAPI: () => axios.put(`/api/user/${user.username}`, {
            data: JSON.stringify(user)
        }).then(response => response.data)
    };
}

export function clearUserStatus() {
    return {
        type: "CLEAR_USER_STATUS" as const
    };
}
