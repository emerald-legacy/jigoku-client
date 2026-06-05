const defaultWindows = {
    dynasty: true,
    draw: true,
    preConflict: true,
    conflict: true,
    fate: true,
    regroup: false
};

const defaultOptionSettings = {
    markCardsUnselectable: true,
    cancelOwnAbilities: false,
    orderForcedAbilities: false,
    confirmOneClick: false,
    disableCardStats: false,
    showStatusInSidebar: false,
    sortHandByName: false,
    showRingEffects: false
};

const defaultSettings = {
    disableGravatar: false,
    windowTimer: 10,
    background: "BG1"
};

const defaultTimerSettings = {
    events: true,
    eventsInDeck: false
};

const defaultPatronSettings = {
    dial: "default",
    fate: "default",
    rings: false,
    tokens: false
};

function getUserWithDefaultsSet(user) {
    let userToReturn = user;

    if(!userToReturn) {
        return userToReturn;
    }

    userToReturn.settings = Object.assign({}, defaultSettings, userToReturn.settings);
    userToReturn.settings.optionSettings = Object.assign({}, defaultOptionSettings, userToReturn.settings.optionSettings);
    userToReturn.settings.timerSettings = Object.assign({}, defaultTimerSettings, userToReturn.settings.timerSettings);
    userToReturn.settings.patron = Object.assign({}, defaultPatronSettings, userToReturn.settings.patron);
    userToReturn.permissions = Object.assign({}, userToReturn.permissions);
    userToReturn.promptedActionWindows = Object.assign({}, defaultWindows, userToReturn.promptedActionWindows);
    if(!userToReturn.blockList) {
        userToReturn.blockList = [];
    }

    return userToReturn;
}

export {
    getUserWithDefaultsSet
};
