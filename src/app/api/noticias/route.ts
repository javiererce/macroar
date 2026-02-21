import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
    { url: "https://www.ambito.com/rss/pages/economia.xml", fuente: "Ámbito" },
    { url: "https://www.cronista.com/files/rss/economia.xml", fuente: "El Cronista" },
    { url: "https://www.infobae.com/feeds/rss/economia/", fuente: "Infobae" },
];

export async function GET() {
    try {
        const feedPromises = FEEDS.map(async (feed) => {
            try {
                const data = await parser.parseURL(feed.url);
                return data.items.map(item => ({
                    titulo: item.title,
                    fuente: feed.fuente,
                    tiempo: item.pubDate ? new Date(item.pubDate).toLocaleTimeString() : 'Reciente',
                    tag: "Mercados", // Default tag
                    tagColor: "accent",
                    link: item.link
                }));
            } catch (err) {
                console.error(`Error fetching feed ${feed.fuente}:`, err);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);
        const flattened = results.flat().sort(() => Math.random() - 0.5).slice(0, 15);

        return NextResponse.json(flattened);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
