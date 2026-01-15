import PropTypes from 'prop-types';
import moment from 'moment';

function NewsItem({ icon, date, text }) {
    return (
        <div className={`${icon}-container`}>
            <span className={`icon-${icon}`} />
            &nbsp;{moment(date).format('YYYY-MM-DD') + ' - ' + text}
        </div>
    );
}

NewsItem.displayName = 'NewsItem';
NewsItem.propTypes = {
    date: PropTypes.string,
    icon: PropTypes.oneOf(['military', 'political']),
    text: PropTypes.string
};

export default NewsItem;
