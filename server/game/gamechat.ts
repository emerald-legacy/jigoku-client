interface ChatPlayer {
    user: {
        username: string;
        emailHash?: string;
        settings?: { disableGravatar?: boolean };
    };
}

interface ChatMessageEntry {
    date: Date;
    message: unknown;
}

type MessageArg = unknown;

class GameChat {
    messages: ChatMessageEntry[];

    constructor() {
        this.messages = [];
    }

    addChatMessage(player: ChatPlayer, message: string) {
        let playerArg = {
            name: player.user.username,
            emailHash: player.user.emailHash,
            noAvatar: player.user.settings?.disableGravatar
        };

        this.addMessage("{0} {1}", playerArg, message);
    }

    addMessage(message: string, ...args: MessageArg[]) {
        let formattedMessage = this.formatMessage(message, args);

        this.messages.push({ date: new Date(), message: formattedMessage });
    }

    addAlert(type: string, message: string, ...args: MessageArg[]) {
        let formattedMessage = this.formatMessage(message, args);

        this.messages.push({ date: new Date(), message: { alert: { type: type, message: formattedMessage } } });
    }

    formatMessage(format: string, args: MessageArg[]): unknown[] | string {
        if(!format) {
            return "";
        }

        let fragments = format.split(/(\{\d+\})/);
        return fragments.reduce<unknown[]>((output, fragment) => {
            let argMatch = fragment.match(/\{(\d+)\}/);
            if(argMatch && args) {
                let arg = args[Number(argMatch[1])] as { message?: unknown; getShortSummary?: () => unknown } | unknown;
                if(arg || arg === 0) {
                    const argObj = arg as { message?: unknown; getShortSummary?: () => unknown };
                    if(argObj && argObj.message) {
                        return output.concat(argObj.message);
                    } else if(Array.isArray(arg)) {
                        if(typeof arg[0] === "string" && arg[0].includes("{")) {
                            return output.concat(this.formatMessage(arg[0], arg.slice(1)));
                        }
                        return output.concat(this.formatArray(arg));
                    } else if(argObj && typeof argObj.getShortSummary === "function") {
                        return output.concat(argObj.getShortSummary());
                    }
                    return output.concat(arg as unknown[] | string | number);

                }
            } else if(!argMatch && fragment) {
                let splitFragment = fragment.split(" ");
                let lastWord = splitFragment.pop();
                return splitFragment.reduce<unknown[]>((output, word) => {
                    return output.concat(word || [], " ");
                }, output).concat(lastWord || []);
            }
            return output;
        }, []);
    }

    formatArray(array: MessageArg[]): unknown[] | string {
        if(array.length === 0) {
            return [];
        }

        var format: string;

        if(array.length === 1) {
            format = "{0}";
        } else if(array.length === 2) {
            format = "{0} and {1}";
        } else {
            var range = Array.from({ length: array.length - 1 }, (_, i) => "{" + i + "}");
            format = range.join(", ") + " and {" + (array.length - 1) + "}";
        }

        return this.formatMessage(format, array);
    }
}

export default GameChat;
