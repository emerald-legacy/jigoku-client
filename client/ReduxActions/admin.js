import axios from "axios";

export function findUser(username) {
    return {
        types: ["REQUEST_FINDUSER", "RECEIVE_FINDUSER"],
        shouldCallAPI: () => true,
        callAPI: () => axios.get(`/api/user/${username}`).then(response => response.data)
    };
}

export function saveUser(user) {
    return {
        types: ["SAVE_USER", "USER_SAVED"],
        shouldCallAPI: () => true,
        callAPI: () => axios.put(`/api/user/${user.username}`, {
            data: JSON.stringify(user)
        }).then(response => response.data)
    };
}

export function clearUserStatus() {
    return {
        type: "CLEAR_USER_STATUS"
    };
}
