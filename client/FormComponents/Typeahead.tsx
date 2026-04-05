import { Typeahead } from "react-bootstrap-typeahead";
import { useRef, useImperativeHandle, forwardRef } from "react";
import type { ReactNode, KeyboardEvent } from "react";

interface TypeaheadInputProps {
    autoFocus?: boolean;
    children?: ReactNode;
    dropup?: boolean;
    emptyLabel?: string;
    fieldClass?: string;
    label?: string;
    labelClass?: string;
    labelKey?: string;
    minLength?: number;
    name: string;
    onChange?: (selected: any[]) => void;
    onInputChange?: (text: string) => void;
    onKeyDown?: (e: KeyboardEvent) => void;
    options: any[];
    placeholder?: string;
    submitFormOnEnter?: boolean;
    validationMessage?: string;
}

export interface TypeaheadInputHandle {
    clear: () => void;
}

const TypeaheadInput = forwardRef<TypeaheadInputHandle, TypeaheadInputProps>(function TypeaheadInput(
    {
        autoFocus,
        children,
        dropup,
        emptyLabel,
        fieldClass,
        label,
        labelClass,
        labelKey,
        minLength,
        name,
        onChange,
        onInputChange,
        onKeyDown,
        options,
        placeholder,
        submitFormOnEnter,
        validationMessage
    },
    ref
) {
    const typeaheadRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        clear: () => {
            if(typeaheadRef.current) {
                typeaheadRef.current.clear();
            }
        }
    }));

    const labelElement = label ? (
        <label htmlFor={ name } className={ `${labelClass || ""} control-label` }>
            { label }
        </label>
    ) : null;

    return (
        <div className="form-group">
            { labelElement }
            <div className={ fieldClass }>
                <Typeahead
                    ref={ typeaheadRef }
                    options={ options }
                    labelKey={ labelKey }
                    emptyLabel={ emptyLabel }
                    onChange={ onChange }
                    placeholder={ placeholder }
                    autoFocus={ autoFocus }
                    dropup={ dropup }
                    minLength={ minLength }
                    onInputChange={ onInputChange }
                    submitFormOnEnter={ submitFormOnEnter }
                    onKeyDown={ onKeyDown }
                />
                { validationMessage ? (
                    <span className="help-block">{ validationMessage } </span>
                ) : null }
            </div>
            { children }
        </div>
    );
});

TypeaheadInput.displayName = "TypeAhead";

export default TypeaheadInput;
