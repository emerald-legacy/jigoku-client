export interface BackgroundOption {
    value: string;
    label: string;
    thumbnail: string;
    cssClass?: string;
}

export const backgrounds: BackgroundOption[] = [
    { value: "none", label: "None", thumbnail: "img/blank.png" },
    { value: "CRAB", label: "Crab", thumbnail: "/img/bgs/crab.jpg", cssClass: "bg-board-crab" },
    { value: "CRAB2", label: "Crab 2", thumbnail: "/img/bgs/crab2.jpg", cssClass: "bg-board-crab2" },
    { value: "CRAB3", label: "Crab 3", thumbnail: "/img/bgs/crab3.jpg", cssClass: "bg-board-crab3" },
    { value: "CRANE", label: "Crane", thumbnail: "/img/bgs/crane.jpg", cssClass: "bg-board-crane" },
    { value: "CRANE2", label: "Crane 2", thumbnail: "/img/bgs/crane2.jpg", cssClass: "bg-board-crane2" },
    { value: "CRANE3", label: "Crane 3", thumbnail: "/img/bgs/crane3.jpg", cssClass: "bg-board-crane3" },
    { value: "CRANE4", label: "Crane 4", thumbnail: "/img/bgs/crane4.jpg", cssClass: "bg-board-crane4" },
    { value: "DRAGON", label: "Dragon", thumbnail: "/img/bgs/dragon.jpg", cssClass: "bg-board-dragon" },
    { value: "DRAGON2", label: "Dragon 2", thumbnail: "/img/bgs/dragon2.jpg", cssClass: "bg-board-dragon2" },
    { value: "DRAGON3", label: "Dragon 3", thumbnail: "/img/bgs/dragon3.jpg", cssClass: "bg-board-dragon3" },
    { value: "LION", label: "Lion", thumbnail: "/img/bgs/lion.jpg", cssClass: "bg-board-lion" },
    { value: "LION2", label: "Lion 2", thumbnail: "/img/bgs/lion2.jpg", cssClass: "bg-board-lion2" },
    { value: "LION3", label: "Lion 3", thumbnail: "/img/bgs/lion3.jpg", cssClass: "bg-board-lion3" },
    { value: "OTTER", label: "Otter", thumbnail: "/img/bgs/otter.jpg", cssClass: "bg-board-otter" },
    { value: "PHOENIX", label: "Phoenix", thumbnail: "/img/bgs/phoenix.jpg", cssClass: "bg-board-phoenix" },
    { value: "PHOENIX2", label: "Phoenix 2", thumbnail: "/img/bgs/phoenix2.jpg", cssClass: "bg-board-phoenix2" },
    { value: "PHOENIX3", label: "Phoenix 3", thumbnail: "/img/bgs/phoenix3.jpg", cssClass: "bg-board-phoenix3" },
    { value: "SCORPION", label: "Scorpion", thumbnail: "/img/bgs/scorpion.jpg", cssClass: "bg-board-scorpion" },
    { value: "SCORPION2", label: "Scorpion 2", thumbnail: "/img/bgs/scorpion2.jpg", cssClass: "bg-board-scorpion2" },
    { value: "SCORPION3", label: "Scorpion 3", thumbnail: "/img/bgs/scorpion3.jpg", cssClass: "bg-board-scorpion3" },
    { value: "UNICORN", label: "Unicorn", thumbnail: "/img/bgs/unicorn.jpg", cssClass: "bg-board-unicorn" },
    { value: "UNICORN2", label: "Unicorn 2", thumbnail: "/img/bgs/unicorn2.jpg", cssClass: "bg-board-unicorn2" },
    { value: "UNICORN3", label: "Unicorn 3", thumbnail: "/img/bgs/unicorn3.jpg", cssClass: "bg-board-unicorn3" }
];

export const backgroundClassByValue: Record<string, string> = Object.fromEntries(
    backgrounds.filter(bg => bg.cssClass).map(bg => [bg.value, bg.cssClass as string])
);
