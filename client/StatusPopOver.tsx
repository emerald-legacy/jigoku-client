import { useState } from "react";
import type { ReactNode } from "react";
// @ts-expect-error react-dom/server has no .d.ts in this layout
import ReactDOMServer from "react-dom/server";

interface StatusPopOverProps {
    children: ReactNode;
    show?: boolean;
    status?: string;
}

function StatusPopOver({ children, show, status }: StatusPopOverProps) {
    const [isHovered, setIsHovered] = useState(false);

    const content = ReactDOMServer.renderToString(children);

    // If show is false, just render the status text without popover
    if(!show) {
        return <span>{ status }</span>;
    }

    return (
        <span
            className="status-popover-container"
            onMouseEnter={ () => setIsHovered(true) }
            onMouseLeave={ () => setIsHovered(false) }
            style={ { position: "relative", cursor: "pointer" } }
        >
            { status }
            { isHovered && (
                <div
                    className="popover bottom in"
                    style={ {
                        display: "block",
                        position: "absolute",
                        top: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1060,
                        minWidth: "200px",
                        maxWidth: "300px"
                    } }
                >
                    <div className="arrow" style={ { left: "50%" } } />
                    { /* eslint-disable-next-line react/no-danger */ }
                    <div className="popover-content" dangerouslySetInnerHTML={ { __html: content } } />
                </div>
            ) }
        </span>
    );
}

StatusPopOver.displayName = "StatusPopOver";

export default StatusPopOver;
