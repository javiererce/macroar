import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured in Vercel. Please set ANTHROPIC_API_KEY." }, { status: 500 });
        }

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1000,
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error("Anthropic API error:", errorData);
            return NextResponse.json({ error: "Error calling AI API" }, { status: response.status });
        }

        const data = await response.json();
        const text = data.content?.[0]?.text ?? "";

        return NextResponse.json({ content: text });
    } catch (e: any) {
        console.error("Error in resumen API:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
