import PropTypes from 'prop-types';

function Input({
    children,
    fieldClass,
    label,
    labelClass,
    name,
    noGroup,
    onBlur,
    onChange,
    placeholder,
    type,
    validationMessage,
    value
}) {
    const inputControl = (
        <div>
            <label htmlFor={name} className={(labelClass || '') + ' control-label'}>
                {label}
            </label>
            <div className={fieldClass}>
                <input
                    type={type}
                    className='form-control'
                    id={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                />
                {validationMessage ? (
                    <span className='help-block'>{validationMessage} </span>
                ) : null}
            </div>
            {children}
        </div>
    );

    if (noGroup) {
        return inputControl;
    }

    return <div className='form-group'>{inputControl}</div>;
}

Input.displayName = 'Input';
Input.propTypes = {
    children: PropTypes.object,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    name: PropTypes.string,
    noGroup: PropTypes.bool,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.oneOf(['text', 'password']),
    validationMessage: PropTypes.string,
    value: PropTypes.string
};

export default Input;
