import { memo } from 'react';
import PropTypes from 'prop-types';

function CardZoom({ cardName, imageUrl, orientation, show }) {
    let zoomClass = 'card-large';

    if(orientation === 'horizontal') {
        zoomClass += '-horizontal';
    }

    return (
        <div className={ zoomClass }>
            { show && cardName !== undefined ? (
                <div className="card-zoomed shadow no-highlight">
                    <span className="card-name">{ cardName }</span>
                    <img src={ imageUrl } />
                </div>
            ) : null }
        </div>
    );
}

CardZoom.displayName = 'CardZoom';
CardZoom.propTypes = {
    cardName: PropTypes.string,
    imageUrl: PropTypes.string,
    orientation: PropTypes.oneOf(['horizontal', 'vertical']),
    show: PropTypes.bool
};

export default memo(CardZoom);
