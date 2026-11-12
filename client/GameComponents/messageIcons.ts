/** Words the chat log can show as icons. */
export const iconsConflict = ["military", "political"];
export const iconsElement = ["air", "earth", "fire", "water", "void"];
export const iconsClan = ["crab", "crane", "dragon", "lion", "phoenix", "scorpion", "unicorn"];

/** Resource words: an icon only after a count ("1 fate", "a card"), not as a verb or noun ("honor them", "a facedown card"). */
export const countedIcons = ["fate", "honor", "card", "cards"];

const COUNT = /^([+-]?\d+|a|one|two|three|four|five|six|seven|eight|nine|ten)$/i;

/** Whether the fragment at `index` is a resource word preceded by a count. */
export function isCountedIcon(fragments: readonly unknown[], index: number): boolean {
    const word = fragments[index];
    if(typeof word !== "string" || !countedIcons.includes(word)) {
        return false;
    }
    let previous = index - 1;
    if(fragments[previous] === " ") {
        previous--;
    }
    const count = fragments[previous];
    return typeof count === "number" || (typeof count === "string" && COUNT.test(count));
}
