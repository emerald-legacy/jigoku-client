import PropTypes from 'prop-types';

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
}) {
    return (
        <div className='form-group'>
            <label htmlFor={ name } className={ (labelClass || '') + ' control-label' }>
                { label }
            </label>
            <div className={ fieldClass }>
                <input
                    type={ type }
                    className='form-control'
                    id={ name }
                    placeholder={ placeholder }
                    value={ value }
                    onChange={ onChange }
                    onBlur={ onBlur }
                />
                { validationMessage ? (
                    <span className='help-block'>{ validationMessage } </span>
                ) : null }
            </div>
            { children }
        </div>
    );
}

Input.displayName = 'Input';
Input.propTypes = {
    children: PropTypes.object,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    type: PropTypes.oneOf(['text', 'password']),
    validationMessage: PropTypes.string,
    value: PropTypes.string
};

export default Input;
