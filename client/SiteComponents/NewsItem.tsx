import { format } from "date-fns";
import React, { type ReactNode } from "react";

interface NewsItemProps {
    date: string;
    text: string;
}

// Whitelisted inline tags + <br>. URLs are auto-linkified.
const RICH_REGEX = /<(b|i|em|strong)>([\s\S]*?)<\/\1>|<br\s*\/?>|(https?:\/\/[^\s<]+)/gi;

function renderRichText(text: string, baseKey = 0): ReactNode[] {
    const out: ReactNode[] = [];
    let lastIndex = 0;
    let key = baseKey;

    for(const match of text.matchAll(RICH_REGEX)) {
        const start = match.index ?? 0;
        if(start > lastIndex) {
            out.push(text.slice(lastIndex, start));
        }

        if(match[1]) {
            const tagName = match[1].toLowerCase() as "b" | "i" | "em" | "strong";
            const inner = match[2];
            out.push(React.createElement(
                tagName,
                { key: `t${key++}` },
                ...renderRichText(inner, key * 100)
            ));
        } else if(match[3]) {
            let url = match[3];
            let trailing = "";
            while(url.length > 0 && /[.,;:!?)\]]/.test(url[url.length - 1])) {
                trailing = url[url.length - 1] + trailing;
                url = url.slice(0, -1);
            }
            out.push(
                <a key={ `u${key++}` } href={ url } target="_blank" rel="noreferrer" className="news-link">{ url }</a>
            );
            if(trailing) {
                out.push(trailing);
            }
        } else {
            out.push(<br key={ `br${key++}` } />);
        }

        lastIndex = start + match[0].length;
    }

    if(lastIndex < text.length) {
        out.push(text.slice(lastIndex));
    }

    return out;
}

function normalize(text: string): string {
    return text
        .replace(/^(?:\s|<br\s*\/?>)+/i, "")
        .replace(/(?:\s|<br\s*\/?>)+$/i, "");
}

function NewsItem({ date, text }: NewsItemProps) {
    const parsedDate = new Date(date);
    return (
        <article className="news-entry">
            <header className="news-entry-meta" aria-label={ format(parsedDate, "yyyy-MM-dd") }>
                <span className="news-entry-day">{ format(parsedDate, "dd") }</span>
                <span className="news-entry-monthyear">
                    <span className="news-entry-month">{ format(parsedDate, "MMM").toUpperCase() }</span>
                    <span className="news-entry-year">{ format(parsedDate, "yyyy") }</span>
                </span>
            </header>
            <div className="news-entry-body">{ renderRichText(normalize(text)) }</div>
        </article>
    );
}

NewsItem.displayName = "NewsItem";

export default NewsItem;
