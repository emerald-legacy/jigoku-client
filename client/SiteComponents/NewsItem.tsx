import { format } from "date-fns";

interface NewsItemProps {
    icon: string;
    date: string;
    text: string;
}

function NewsItem({ icon, date, text }: NewsItemProps) {
    return (
        <div className={ `${icon}-container` }>
            <span className={ `icon-${icon}` } />
            &nbsp;{ `${format(new Date(date), "yyyy-MM-dd")} - ${text}` }
        </div>
    );
}

NewsItem.displayName = "NewsItem";

export default NewsItem;
