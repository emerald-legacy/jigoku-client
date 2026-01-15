import PropTypes from 'prop-types';

function HonorFan({ size, value }) {
    return (
        <div className={'honor-fan no-highlight ' + size}>
            <img className='honor-fan-value' src={'/img/honorfan-' + value + '.png'} />
        </div>
    );
}

HonorFan.displayName = 'HonorFan';
HonorFan.propTypes = {
    buttons: PropTypes.array,
    onButtonClick: PropTypes.func,
    onMouseOut: PropTypes.func,
    onMouseOver: PropTypes.func,
    size: PropTypes.string,
    socket: PropTypes.object,
    value: PropTypes.string
};

export default HonorFan;
