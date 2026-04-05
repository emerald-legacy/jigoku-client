export function navigate(path: string, search?: string) {
    return {
        type: "NAVIGATE" as const,
        newPath: path,
        search: search
    };
}

export function setUrl(path: string) {
    return {
        type: "SET_URL" as const,
        path: path
    };
}

export function setContextMenu(menu: any) {
    return {
        type: "SET_CONTEXT_MENU" as const,
        menu: menu
    };
}

export function zoomCard(card: any) {
    return {
        type: "ZOOM_CARD" as const,
        card: card
    };
}

export function clearZoom() {
    return {
        type: "CLEAR_ZOOM" as const
    };
}

export function receiveBannerNotice(notice: string) {
    return {
        type: "RECEIVE_BANNER_NOTICE" as const,
        notice: notice
    };
}
