import type { FocusEvent } from "react";

export interface SelectOption {
    name?: string;
    value?: string;
}

interface SelectButton {
    text: string;
    onClick: () => void;
}

interface SelectProps {
    blankOption?: SelectOption;
    button?: SelectButton;
    fieldClass?: string;
    label?: string;
    labelClass?: string;
    name: string;
    nameKey?: string;
    onBlur?: (e: FocusEvent<HTMLSelectElement>) => void;
    onChange: (value: SelectOption | undefined) => void;
    options?: SelectOption[];
    validationMessage?: string;
    value?: string;
    valueKey?: string;
}

function Select({
    blankOption,
    button,
    fieldClass,
    label,
    labelClass,
    name,
    nameKey = "name",
    onBlur,
    onChange,
    options,
    validationMessage,
    value,
    valueKey = "value"
}: SelectProps) {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedValue = options?.find(
            (option) => (option as Record<string, string | undefined>)[valueKey] === event.target.value
        );
        onChange(selectedValue);
    };

    const optionElements: React.ReactNode[] = [];

    if(blankOption) {
        const blankValue = (blankOption as Record<string, string | undefined>)[valueKey];
        const blankName = (blankOption as Record<string, string | undefined>)[nameKey];
        optionElements.push(
            <option key="default" value={ blankValue }>
                { blankName }
            </option>
        );
    }

    if(options) {
        options.forEach((option) => {
            const optionValue = (option as Record<string, string | undefined>)[valueKey];
            const optionName = (option as Record<string, string | undefined>)[nameKey];
            optionElements.push(
                <option key={ optionValue } value={ optionValue }>
                    { optionName }
                </option>
            );
        });
    }

    const selectStyle = button
        ? { display: "inline-block", width: "67%" }
        : {};

    return (
        <div className="form-group">
            <label htmlFor={ name } className={ `${labelClass || ""} control-label` }>
                { label }
            </label>
            <div className={ fieldClass }>
                <select
                    style={ selectStyle }
                    className="form-control"
                    id={ name }
                    value={ value }
                    onChange={ handleChange }
                    onBlur={ onBlur }
                >
                    { optionElements }
                </select>
                { validationMessage ? (
                    <span className="help-block">{ validationMessage } </span>
                ) : null }
                { button ? (
                    <button className="btn btn-default select-button" onClick={ button.onClick }>
                        { button.text }
                    </button>
                ) : null }
            </div>
        </div>
    );
}

Select.displayName = "Select";

export default Select;
