import type { Dispatch } from "redux";
import { setPath, setContextMenu } from "../reducers/navigation";

export { setContextMenu };
export { zoomCard, clearZoom } from "../reducers/cards";
export { receiveBannerNotice } from "../reducers/chat";

export function navigate(path: string) {
    return (dispatch: Dispatch) => {
        window.history.pushState({}, "", path);
        dispatch(setPath(path));
    };
}

export function setUrl(url: string) {
    return () => {
        window.history.replaceState({}, "", url);
    };
}
