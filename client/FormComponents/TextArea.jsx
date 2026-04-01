import PropTypes from 'prop-types';

function TextArea({
    children,
    fieldClass,
    label,
    labelClass,
    name,
    onBlur,
    onChange,
    placeholder,
    rows,
    validationMessage,
    value
}) {
    return (
        <div className="form-group">
            <label htmlFor={ name } className={ `${labelClass || ''} control-label` }>
                { label }
            </label>
            <div className={ fieldClass }>
                <textarea
                    rows={ rows }
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

TextArea.displayName = 'TextArea';
TextArea.propTypes = {
    children: PropTypes.object,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    name: PropTypes.string,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    rows: PropTypes.string,
    validationMessage: PropTypes.string,
    value: PropTypes.string
};

export default TextArea;
