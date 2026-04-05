import type { ReactNode, ChangeEvent, FocusEvent } from "react";

interface InputProps {
    children?: ReactNode;
    fieldClass?: string;
    label?: string;
    labelClass?: string;
    name: string;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    type?: string;
    validationMessage?: string;
    value?: string;
}

function Input({
    children,
    fieldClass,
    label,
    labelClass,
    name,
    onBlur,
    onChange,
    placeholder,
    type,
    validationMessage,
    value
}: InputProps) {
    return (
        <div className="form-group">
            <label htmlFor={ name } className={ `${labelClass || ""} control-label` }>
                { label }
            </label>
            <div className={ fieldClass }>
                <input
                    type={ type }
                    className="form-control"
                    id={ name }
                    placeholder={ placeholder }
                    value={ value }
                    onChange={ onChange }
                    onBlur={ onBlur }
                />
                { validationMessage ? (
                    <span className="help-block">{ validationMessage } </span>
                ) : null }
            </div>
            { children }
        </div>
    );
}

Input.displayName = "Input";

export default Input;
