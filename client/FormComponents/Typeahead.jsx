import { Typeahead } from 'react-bootstrap-typeahead';
import { useRef, useImperativeHandle, forwardRef } from 'react';

const TypeaheadInput = forwardRef(function TypeaheadInput(
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
    const typeaheadRef = useRef(null);

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

TypeaheadInput.displayName = 'TypeAhead';

export default TypeaheadInput;
