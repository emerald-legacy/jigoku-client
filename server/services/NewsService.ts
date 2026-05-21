import type { Collection, Db } from "mongodb";
import type { NewsItem } from "../../client/types/redux.js";

class NewsService {
    news: Collection<NewsItem>;

    constructor(db: Db) {
        this.news = db.collection<NewsItem>("news");
    }

    async getRecentNewsItems(options: { limit?: number | string }) {
        let query = this.news.find({}).sort({ datePublished: -1 });

        if(options.limit) {
            query = query.limit(parseInt(String(options.limit)));
        }

        return query.toArray();
    }

    async addNews(news: NewsItem) {
        const result = await this.news.insertOne(news);
        return { ...news, _id: result.insertedId };
    }
}

export default NewsService;
