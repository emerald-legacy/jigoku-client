import { useEffect, useState } from "react";
import {
    dialMaterials,
    dialTypes,
    tokenMaterials,
    ringSets,
    dialFrame,
    tokenImage,
    ringSetImage,
    parseDial,
    formatDial,
    honorDialDigit,
    FALLBACK_DIAL_FRAME,
    DEFAULT_TOKENS,
    DEFAULT_RINGS
} from "./boardCosmetics";
import { asset } from "./assetUrl";
import { getCardImageUrl } from "./cardImageUrl";

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

// --- Token picker: one swatch per material, showing the fate + honor + first-player set ---
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
                            <FallbackImg className="token-img" src={ tokenImage(mat.id, "firstplayer") } fallback={ tokenImage(DEFAULT_TOKENS, "firstplayer") } alt={ `${mat.label} first-player token` } />
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

const RING_SAMPLE_ELEMENT = "fire";

export function RingPicker({ value, isPatron, onChange }: PickerProps) {
    return (
        <div className="ring-row">
            { ringSets.map(set => {
                const locked = set.patron && !isPatron;
                const active = !locked && (value === set.id || (!value && set.id === DEFAULT_RINGS));
                const isDefault = set.id === DEFAULT_RINGS;
                return (
                    <button
                        key={ set.id }
                        type="button"
                        disabled={ locked }
                        className={ `ring-swatch${active ? " selected" : ""}${locked ? " locked" : ""}` }
                        title={ locked ? `${set.label} (patron only)` : set.label }
                        onClick={ () => {
                            if(!locked) {
                                onChange(set.id);
                            }
                        } }
                    >
                        <span className="ring-swatch-preview">
                            { isDefault ? (
                                <>
                                    <span className="ring-swatch-default-bg" />
                                    <span className="icon-element-fire ring-swatch-default-glyph" aria-hidden="true" />
                                </>
                            ) : (
                                <FallbackImg
                                    className="ring-swatch-img"
                                    src={ ringSetImage(set.id, "military", RING_SAMPLE_ELEMENT) }
                                    fallback={ asset(`military-${RING_SAMPLE_ELEMENT}.png`) }
                                    alt={ `${set.label} ring` }
                                />
                            ) }
                        </span>
                        <span className="dial-label">
                            { set.label }
                            { locked ? <span className="lock-badge" aria-label="Patron only">🔒</span> : null }
                        </span>
                    </button>
                );
            }) }
        </div>
    );
}

// --- Promo card art picker: standard vs promo, previewed on a sample card ---
const PROMO_SAMPLE_ID = "hida-honoka";
const PROMO_SAMPLE_PACK = "emerald-core-set";

interface PromoPickerProps {
    value: boolean;
    isPatron: boolean;
    onChange: (value: boolean) => void;
}

export function PromoPicker({ value, isPatron, onChange }: PromoPickerProps) {
    const standardSrc = getCardImageUrl(PROMO_SAMPLE_ID, PROMO_SAMPLE_PACK);
    const promoSrc = getCardImageUrl(PROMO_SAMPLE_ID, PROMO_SAMPLE_PACK, true);
    const options = [
        { promo: false, label: "Standard", src: standardSrc },
        { promo: true, label: "Promo", src: promoSrc }
    ];

    return (
        <>
            { !isPatron ? (
                <p className="cosmetic-lock-hint">Become a patron to play with promo card art.</p>
            ) : null }
            <div className="promo-row">
                { options.map(option => (
                    <button
                        key={ option.label }
                        type="button"
                        disabled={ !isPatron }
                        className={ `promo-swatch${value === option.promo ? " selected" : ""}${!isPatron ? " locked" : ""}` }
                        title={ option.label }
                        onClick={ () => {
                            if(isPatron) {
                                onChange(option.promo);
                            }
                        } }
                    >
                        <FallbackImg className="promo-card-img" src={ option.src } fallback={ standardSrc } alt={ `${option.label} card art` } />
                        <span className="dial-label">
                            { option.label }
                            { option.promo && !isPatron ? <span className="lock-badge" aria-label="Patron only">🔒</span> : null }
                        </span>
                    </button>
                )) }
            </div>
        </>
    );
}
