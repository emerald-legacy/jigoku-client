class NewsService {
    constructor(db) {
        this.news = db.collection('news');
    }

    async getRecentNewsItems(options) {
        let query = this.news.find({}).sort({ datePublished: -1 });

        if(options.limit) {
            query = query.limit(parseInt(options.limit));
        }

        return query.toArray();
    }

    async addNews(news) {
        const result = await this.news.insertOne(news);
        return { ...news, _id: result.insertedId };
    }
}

module.exports = NewsService;
