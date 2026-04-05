import NewsItem from "./NewsItem";

interface NewsEntry {
    datePublished: string;
    text: string;
}

interface NewsProps {
    news?: NewsEntry[];
}

function News({ news }: NewsProps) {
    const icons = ["military", "political"];

    if(!news || news.length === 0) {
        return (
            <div className="news-container">
                <div className="military-container">There is no site news at the moment</div>
            </div>
        );
    }

    const newsItems = news.map((newsItem, index) => (
        <NewsItem
            key={ newsItem.datePublished }
            icon={ icons[index % 2] }
            date={ newsItem.datePublished }
            text={ newsItem.text }
        />
    ));

    return (
        <div className="news-container">
            { newsItems }
        </div>
    );
}

News.displayName = "News";

export default News;
