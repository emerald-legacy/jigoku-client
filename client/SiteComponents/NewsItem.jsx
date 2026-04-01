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

export default NewsItem;
