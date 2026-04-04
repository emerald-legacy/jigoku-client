
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
            <label htmlFor={ name } className={ `${labelClass || ""} control-label` }>
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

TextArea.displayName = "TextArea";

export default TextArea;
