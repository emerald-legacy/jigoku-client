import PropTypes from 'prop-types';

function Checkbox({
    checked,
    children,
    fieldClass,
    label,
    labelClass,
    name,
    noGroup,
    onChange
}) {
    const checkBox = (
        <div className={ 'checkbox ' + (fieldClass || '') }>
            <label htmlFor={ name } className={ labelClass }>
                <input
                    type='checkbox'
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

    return <div className='form-group'>{ checkBox }</div>;
}

Checkbox.displayName = 'Checkbox';
Checkbox.propTypes = {
    checked: PropTypes.bool,
    children: PropTypes.object,
    fieldClass: PropTypes.string,
    label: PropTypes.string,
    labelClass: PropTypes.string,
    name: PropTypes.string,
    noGroup: PropTypes.bool,
    onChange: PropTypes.func
};

export default Checkbox;
