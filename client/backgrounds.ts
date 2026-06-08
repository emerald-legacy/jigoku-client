import { asset } from "./assetUrl";

export interface BackgroundOption {
    value: string;
    label: string;
    thumbnail: string;
}

export const backgrounds: BackgroundOption[] = [
    { value: "none", label: "None", thumbnail: "" },
    { value: "CRAB", label: "Crab", thumbnail: asset("bgs/crab.jpg") },
    { value: "CRAB2", label: "Crab 2", thumbnail: asset("bgs/crab2.jpg") },
    { value: "CRAB3", label: "Crab 3", thumbnail: asset("bgs/crab3.jpg") },
    { value: "CRANE", label: "Crane", thumbnail: asset("bgs/crane.jpg") },
    { value: "CRANE2", label: "Crane 2", thumbnail: asset("bgs/crane2.jpg") },
    { value: "CRANE3", label: "Crane 3", thumbnail: asset("bgs/crane3.jpg") },
    { value: "CRANE4", label: "Crane 4", thumbnail: asset("bgs/crane4.jpg") },
    { value: "DRAGON", label: "Dragon", thumbnail: asset("bgs/dragon.jpg") },
    { value: "DRAGON2", label: "Dragon 2", thumbnail: asset("bgs/dragon2.jpg") },
    { value: "DRAGON3", label: "Dragon 3", thumbnail: asset("bgs/dragon3.jpg") },
    { value: "LION", label: "Lion", thumbnail: asset("bgs/lion.jpg") },
    { value: "LION2", label: "Lion 2", thumbnail: asset("bgs/lion2.jpg") },
    { value: "LION3", label: "Lion 3", thumbnail: asset("bgs/lion3.jpg") },
    { value: "OTTER", label: "Otter", thumbnail: asset("bgs/otter.jpg") },
    { value: "PHOENIX", label: "Phoenix", thumbnail: asset("bgs/phoenix.jpg") },
    { value: "PHOENIX2", label: "Phoenix 2", thumbnail: asset("bgs/phoenix2.jpg") },
    { value: "PHOENIX3", label: "Phoenix 3", thumbnail: asset("bgs/phoenix3.jpg") },
    { value: "SCORPION", label: "Scorpion", thumbnail: asset("bgs/scorpion.jpg") },
    { value: "SCORPION2", label: "Scorpion 2", thumbnail: asset("bgs/scorpion2.jpg") },
    { value: "SCORPION3", label: "Scorpion 3", thumbnail: asset("bgs/scorpion3.jpg") },
    { value: "UNICORN", label: "Unicorn", thumbnail: asset("bgs/unicorn.jpg") },
    { value: "UNICORN2", label: "Unicorn 2", thumbnail: asset("bgs/unicorn2.jpg") },
    { value: "UNICORN3", label: "Unicorn 3", thumbnail: asset("bgs/unicorn3.jpg") }
];

const DEFAULT_BACKGROUND = asset("bgs/main.jpg");

const imageByValue: Record<string, string> = Object.fromEntries(
    backgrounds.filter(bg => bg.thumbnail).map(bg => [bg.value, bg.thumbnail])
);

export function backgroundImageByValue(value: string | undefined): string {
    return (value && imageByValue[value]) || DEFAULT_BACKGROUND;
}
