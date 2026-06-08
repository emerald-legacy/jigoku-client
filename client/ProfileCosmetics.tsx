import { useEffect, useState } from "react";
import {
    dialMaterials,
    dialTypes,
    tokenMaterials,
    dialFrame,
    tokenImage,
    parseDial,
    formatDial,
    honorDialDigit,
    FALLBACK_DIAL_FRAME,
    DEFAULT_TOKENS
} from "./patronOptions";

// An <img> that swaps to a fallback once if its source fails to load. Used so the
// pickers stay populated while placeholder/in-progress art is still missing.
function FallbackImg({ src, fallback, alt, className }: { src: string; fallback: string; alt: string; className?: string }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        setFailed(false);
    }, [src]);
    return (
        <img
            className={ className }
            src={ failed ? fallback : src }
            alt={ alt }
            onError={ () => setFailed(true) }
        />
    );
}

interface PickerProps {
    value: string;
    isPatron: boolean;
    onChange: (value: string) => void;
}

// --- Dial picker: material tabs + a grid of dial frames ---------------------
const SAMPLE_DIGIT = 0;

export function DialPicker({ value, isPatron, onChange }: PickerProps) {
    const selected = parseDial(value);
    const [activeMaterial, setActiveMaterial] = useState(selected.material);

    useEffect(() => {
        setActiveMaterial(selected.material);
    }, [selected.material]);

    const material = dialMaterials.find(m => m.id === activeMaterial) ?? dialMaterials[0];
    const materialLocked = material.patron && !isPatron;

    return (
        <div className="cosmetic-picker">
            <div className="cosmetic-tabs" role="tablist">
                { dialMaterials.map(mat => {
                    const locked = mat.patron && !isPatron;
                    return (
                        <button
                            key={ mat.id }
                            type="button"
                            role="tab"
                            aria-selected={ mat.id === activeMaterial }
                            className={ `cosmetic-tab${mat.id === activeMaterial ? " active" : ""}${locked ? " locked" : ""}` }
                            onClick={ () => setActiveMaterial(mat.id) }
                        >
                            { mat.label }
                            { locked ? <span className="lock-badge" aria-label="Patron only">🔒</span> : null }
                        </button>
                    );
                }) }
            </div>

            { materialLocked ? (
                <p className="cosmetic-lock-hint">Become a patron to unlock the { material.label } dials.</p>
            ) : null }

            <div className="dial-grid">
                { dialTypes.map(type => {
                    const setValue = formatDial(material.id, type.id);
                    const isSelected = !materialLocked && value === setValue;
                    return (
                        <button
                            key={ type.id }
                            type="button"
                            disabled={ materialLocked }
                            className={ `dial-swatch${isSelected ? " selected" : ""}${materialLocked ? " locked" : ""}` }
                            title={ type.label }
                            onClick={ () => {
                                if(!materialLocked) {
                                    onChange(setValue);
                                }
                            } }
                        >
                            <span className="dial-frame">
                                <FallbackImg
                                    className="dial-frame-img"
                                    src={ dialFrame(material.id, type.id) }
                                    fallback={ FALLBACK_DIAL_FRAME }
                                    alt={ `${material.label} ${type.label} dial` }
                                />
                                <img className="dial-digit" src={ honorDialDigit(SAMPLE_DIGIT) } alt="" aria-hidden="true" />
                            </span>
                            <span className="dial-label">{ type.label }</span>
                        </button>
                    );
                }) }
            </div>
        </div>
    );
}

// --- Token picker: one swatch per material, showing the fate + honor pair ---
export function TokenPicker({ value, isPatron, onChange }: PickerProps) {
    return (
        <div className="token-row">
            { tokenMaterials.map(mat => {
                const locked = mat.patron && !isPatron;
                const active = !locked && (value === mat.id || (!value && mat.id === DEFAULT_TOKENS));
                return (
                    <button
                        key={ mat.id }
                        type="button"
                        disabled={ locked }
                        className={ `token-swatch${active ? " selected" : ""}${locked ? " locked" : ""}` }
                        title={ locked ? `${mat.label} (patron only)` : mat.label }
                        onClick={ () => {
                            if(!locked) {
                                onChange(mat.id);
                            }
                        } }
                    >
                        <span className="token-pair">
                            <FallbackImg className="token-img" src={ tokenImage(mat.id, "fate") } fallback={ tokenImage(DEFAULT_TOKENS, "fate") } alt={ `${mat.label} fate token` } />
                            <FallbackImg className="token-img" src={ tokenImage(mat.id, "honor") } fallback={ tokenImage(DEFAULT_TOKENS, "honor") } alt={ `${mat.label} honor token` } />
                        </span>
                        <span className="dial-label">
                            { mat.label }
                            { locked ? <span className="lock-badge" aria-label="Patron only">🔒</span> : null }
                        </span>
                    </button>
                );
            }) }
        </div>
    );
}
