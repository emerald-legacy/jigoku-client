import type React from "react";

/**
 * Keyboard support for an element that acts like a button but can't be a <button> (it contains other controls, or block
 * content): Enter and Space run `handler`, as they do on a real button. Keys pressed inside a nested control are left alone.
 */
export function activateOnKey(handler: () => void) {
    return (event: React.KeyboardEvent<HTMLElement>) => {
        if(event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) {
            return;
        }
        event.preventDefault();
        handler();
    };
}
