import PropTypes from 'prop-types';
import { format } from 'date-fns';

function NewsItem({ icon, date, text }) {
    return (
        <div className={ `${icon}-container` }>
            <span className={ `icon-${icon}` } />
            &nbsp;{ format(new Date(date), 'yyyy-MM-dd') + ' - ' + text }
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
