import { honorDialImage } from "../patronOptions";

interface HonorFanProps {
    size: string;
    value: number;
    dialSet?: string;
}

function HonorFan({ size, value, dialSet }: HonorFanProps) {
    return (
        <div className={ `honor-fan no-highlight ${size}` }>
            <img className="honor-fan-value" src={ honorDialImage(dialSet || "default", value) } />
        </div>
    );
}

HonorFan.displayName = "HonorFan";

export default HonorFan;
