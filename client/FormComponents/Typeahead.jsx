import { Typeahead } from 'react-bootstrap-typeahead';
import { useRef, useImperativeHandle, forwardRef } from 'react';
import PropTypes from 'prop-types';

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
            if (typeaheadRef.current) {
                typeaheadRef.current.clear();
            }
        }
    }));

    const labelElement = label ? (
        <label htmlFor={name} className={(labelClass || '') + ' control-label'}>
            {label}
        </label>
    ) : null;

    return (
        <div className='form-group'>
            {labelElement}
            <div className={fieldClass}>
                <Typeahead
                    ref={typeaheadRef}
                    options={options}
                    labelKey={labelKey}
                    emptyLabel={emptyLabel}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    dropup={dropup}
                    minLength={minLength}
                    onInputChange={onInputChange}
                    submitFormOnEnter={submitFormOnEnter}
                    onKeyDown={onKeyDown}
                />
                {validationMessage ? (
                    <span className='help-block'>{validationMessage} </span>
                ) : null}
            </div>
            {children}
        </div>
    );
});

TypeaheadInput.displayName = 'TypeAhead';
TypeaheadInput.propTypes = {
    autoFocus: PropTypes.bool,
    children: PropTypes.object,
    dropup: PropTypes.bool,
    emptyLabel: PropTypes.string,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    labelKey: PropTypes.string,
    minLength: PropTypes.number,
    name: PropTypes.string,
    onChange: PropTypes.func,
    onInputChange: PropTypes.func,
    onKeyDown: PropTypes.func,
    options: PropTypes.array,
    placeholder: PropTypes.string,
    submitFormOnEnter: PropTypes.bool,
    validationMessage: PropTypes.string,
    value: PropTypes.string
};

export default TypeaheadInput;
