
interface HonorFanProps {
    size: string;
    value: number;
}

function HonorFan({ size, value }: HonorFanProps) {
    return (
        <div className={ `honor-fan no-highlight ${size}` }>
            <img className="honor-fan-value" src={ `/img/honorfan-${value}.png` } />
        </div>
    );
}

HonorFan.displayName = "HonorFan";

export default HonorFan;
