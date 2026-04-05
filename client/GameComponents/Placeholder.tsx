
interface PlaceholderProps {
    className?: string;
    orientation?: string;
    size?: string;
}

function Placeholder({ className: propsClassName, orientation = "vertical", size }: PlaceholderProps) {
    let className = `panel placeholder ${propsClassName || ""}`;

    if(orientation === "horizontal") {
        className += " horizontal";
    } else {
        className += " vertical";
    }

    if(size !== "normal") {
        className += ` ${size}`;
    }

    return (
        <div className={ className }>
            <div className="card-placeholder" />
        </div>
    );
}

Placeholder.displayName = "Placeholder";

export default Placeholder;
