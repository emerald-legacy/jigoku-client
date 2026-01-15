import PropTypes from 'prop-types';

function Select({
    blankOption,
    button,
    fieldClass,
    label,
    labelClass,
    name,
    nameKey = 'name',
    onBlur,
    onChange,
    options,
    validationMessage,
    value,
    valueKey = 'value'
}) {
    const handleChange = (event) => {
        const selectedValue = options?.find(
            (option) => option[valueKey] === event.target.value
        );
        onChange(selectedValue);
    };

    const optionElements = [];

    if (blankOption) {
        const blankValue = blankOption[valueKey];
        const blankName = blankOption[nameKey];
        optionElements.push(
            <option key='default' value={blankValue}>
                {blankName}
            </option>
        );
    }

    if (options) {
        options.forEach((option) => {
            const optionValue = option[valueKey];
            const optionName = option[nameKey];
            optionElements.push(
                <option key={optionValue} value={optionValue}>
                    {optionName}
                </option>
            );
        });
    }

    const selectStyle = button
        ? { display: 'inline-block', width: '67%' }
        : {};

    return (
        <div className='form-group'>
            <label htmlFor={name} className={(labelClass || '') + ' control-label'}>
                {label}
            </label>
            <div className={fieldClass}>
                <select
                    style={selectStyle}
                    className='form-control'
                    id={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={onBlur}
                >
                    {optionElements}
                </select>
                {validationMessage ? (
                    <span className='help-block'>{validationMessage} </span>
                ) : null}
                {button ? (
                    <button className='btn btn-default select-button' onClick={button.onClick}>
                        {button.text}
                    </button>
                ) : null}
            </div>
        </div>
    );
}

Select.displayName = 'Select';
Select.propTypes = {
    blankOption: PropTypes.object,
    button: PropTypes.object,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    name: PropTypes.string,
    nameKey: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    options: PropTypes.array,
    validationMessage: PropTypes.string,
    value: PropTypes.string,
    valueKey: PropTypes.string
};

export default Select;
