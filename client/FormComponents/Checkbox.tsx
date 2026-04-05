import type { ReactNode, ChangeEvent } from "react";

interface CheckboxProps {
    checked?: boolean;
    children?: ReactNode;
    fieldClass?: string;
    label?: string;
    labelClass?: string;
    name: string;
    noGroup?: boolean;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

function Checkbox({
    checked,
    children,
    fieldClass,
    label,
    labelClass,
    name,
    noGroup,
    onChange
}: CheckboxProps) {
    const checkBox = (
        <div className={ `checkbox ${fieldClass || ""}` }>
            <label htmlFor={ name } className={ labelClass }>
                <input
                    type="checkbox"
                    id={ name }
                    checked={ checked }
                    onChange={ onChange }
                />
                { label }
            </label>
            { children }
        </div>
    );

    if(noGroup) {
        return checkBox;
    }

    return <div className="form-group">{ checkBox }</div>;
}

Checkbox.displayName = "Checkbox";

export default Checkbox;
