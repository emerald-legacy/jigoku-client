import { honorDialDigit, honorDialFrame } from "../boardCosmetics";

interface HonorFanProps {
    size: string;
    value: number;
    dialSet?: string;
}

function HonorFan({ size, value, dialSet }: HonorFanProps) {
    return (
        <div className={ `honor-fan no-highlight ${size}` }>
            <img
                className="honor-fan-value"
                src={ honorDialDigit(value) }
                style={ { backgroundImage: `url(${honorDialFrame(dialSet || "default")})` } }
            />
        </div>
    );
}

HonorFan.displayName = "HonorFan";

export default HonorFan;
