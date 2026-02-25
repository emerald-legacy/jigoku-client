import PropTypes from 'prop-types';

function Placeholder({ className: propsClassName, orientation = 'vertical', size }) {
    let className = `panel placeholder ${propsClassName || ''}`;

    if(orientation === 'horizontal') {
        className += ' horizontal';
    } else {
        className += ' vertical';
    }

    if(size !== 'normal') {
        className += ` ${size}`;
    }

    return (
        <div className={ className }>
            <div className='card-placeholder' />
        </div>
    );
}

Placeholder.displayName = 'Placeholder';
Placeholder.propTypes = {
    className: PropTypes.string,
    orientation: PropTypes.oneOf(['horizontal', 'bowed', 'vertical']),
    size: PropTypes.string
};

export default Placeholder;
