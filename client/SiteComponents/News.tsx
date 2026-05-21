import NewsItem from "./NewsItem";

interface NewsEntry {
    datePublished: string;
    text: string;
}

interface NewsProps {
    news?: NewsEntry[];
}

function News({ news }: NewsProps) {
    if(!news || news.length === 0) {
        return (
            <div className="news-empty">The court is silent. No dispatches at this hour.</div>
        );
    }

    return (
        <ol className="news-list">
            { news.map((item) => (
                <li key={ item.datePublished } className="news-list-item">
                    <NewsItem date={ item.datePublished } text={ item.text } />
                </li>
            )) }
        </ol>
    );
}

News.displayName = "News";

export default News;
