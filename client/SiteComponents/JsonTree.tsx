import React, { useState } from "react";
import { ChevronRight } from "lucide-react";

interface JsonTreeProps {
    data: unknown;
    rootLabel?: string;
    initialDepth?: number;
}

interface NodeProps {
    label?: string | number;
    value: unknown;
    depth: number;
    initialDepth: number;
    isLast?: boolean;
}

function typeOf(value: unknown): "object" | "array" | "string" | "number" | "boolean" | "null" | "undefined" {
    if(value === null) {
        return "null";
    }
    if(value === undefined) {
        return "undefined";
    }
    if(Array.isArray(value)) {
        return "array";
    }
    return typeof value as "object" | "string" | "number" | "boolean";
}

function previewPrimitive(value: unknown, kind: string) {
    if(kind === "string") {
        return <span className="json-tree-string">{ `"${String(value)}"` }</span>;
    }
    if(kind === "number") {
        return <span className="json-tree-number">{ String(value) }</span>;
    }
    if(kind === "boolean") {
        return <span className="json-tree-boolean">{ String(value) }</span>;
    }
    if(kind === "null") {
        return <span className="json-tree-null">null</span>;
    }
    if(kind === "undefined") {
        return <span className="json-tree-null">undefined</span>;
    }
    return null;
}

function Node({ label, value, depth, initialDepth, isLast }: NodeProps) {
    const kind = typeOf(value);
    const isContainer = kind === "object" || kind === "array";
    const [open, setOpen] = useState(depth < initialDepth);

    if(!isContainer) {
        return (
            <div className="json-tree-row json-tree-leaf">
                { label !== undefined ? <span className="json-tree-key">{ String(label) }</span> : null }
                { label !== undefined ? <span className="json-tree-colon">:</span> : null }
                { previewPrimitive(value, kind) }
                { !isLast ? <span className="json-tree-comma">,</span> : null }
            </div>
        );
    }

    const entries: Array<[string | number, unknown]> = kind === "array"
        ? (value as unknown[]).map((v, i): [number, unknown] => [i, v])
        : Object.entries(value as Record<string, unknown>);

    const count = entries.length;
    const openBracket = kind === "array" ? "[" : "{";
    const closeBracket = kind === "array" ? "]" : "}";

    return (
        <div className="json-tree-node">
            <button
                type="button"
                className={ `json-tree-row json-tree-toggle ${open ? "is-open" : ""}` }
                onClick={ () => setOpen(o => !o) }
            >
                <ChevronRight size={ 12 } className="json-tree-caret" />
                { label !== undefined ? <span className="json-tree-key">{ String(label) }</span> : null }
                { label !== undefined ? <span className="json-tree-colon">:</span> : null }
                <span className="json-tree-bracket">{ openBracket }</span>
                { !open && count > 0 ? (
                    <span className="json-tree-summary">{ count } { kind === "array" ? "item" : "key" }{ count === 1 ? "" : "s" }</span>
                ) : null }
                { !open ? <span className="json-tree-bracket">{ closeBracket }</span> : null }
                { !open && !isLast ? <span className="json-tree-comma">,</span> : null }
            </button>
            { open ? (
                <div className="json-tree-children">
                    { entries.map(([childKey, childValue], i) => (
                        <Node
                            key={ String(childKey) }
                            label={ childKey }
                            value={ childValue }
                            depth={ depth + 1 }
                            initialDepth={ initialDepth }
                            isLast={ i === entries.length - 1 }
                        />
                    )) }
                    <div className="json-tree-row json-tree-close">
                        <span className="json-tree-bracket">{ closeBracket }</span>
                        { !isLast ? <span className="json-tree-comma">,</span> : null }
                    </div>
                </div>
            ) : null }
        </div>
    );
}

export default function JsonTree({ data, rootLabel, initialDepth = 2 }: JsonTreeProps) {
    return (
        <div className="json-tree">
            <Node
                label={ rootLabel }
                value={ data }
                depth={ 0 }
                initialDepth={ initialDepth }
                isLast
            />
        </div>
    );
}
