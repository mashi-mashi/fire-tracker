import { OpenAI } from "openai";

// 環境変数からOpenAI APIキーを取得
// const openai = new OpenAI({
//   apiKey: env.OPENAI_API_KEY,
// });

export const getOpenAI = (apiKey: string): OpenAI => {
  return new OpenAI({
    apiKey,
  });
}

async function scrapeWebsiteContent(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const text = response.text();
    console.log({ text })
    return text;
  } catch (error) {
    console.error('Error scraping website:', error);
    return '';
  }
}

export type CallResult = {
  url: string;
  type: "success"
  title: string;
  summary: string;
  tags: string[];
} | {
  url: string;
  type: "access-error" | "summarize-error" | 'parse-error';
};


export async function summarizeWebPageWithStructuredJSON(openai: OpenAI, url: string): Promise<CallResult> {
  try {

    const content = await scrapeWebsiteContent(url);
    if (!content) {
      return {
        url,
        type: "access-error",
      };
    }

    const prompt = `このウェブページでメインで報じられている内容のタイトル、メインコンテンツの概要、生成タグを抽出してください: ${content}
    サイドのリンク記事や広告は無視してください。英語の記事であっても日本語の記事であっても全て日本語で出力してください。
    次に、結果を次のようにJSONでフォーマットしてください。{
      "title": "Here goes the extracted title",
      "summary": "Here goes the summary of the main content",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }`;

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });

    const result = safeParse(url, chatCompletion.choices[0]?.message.content || undefined);
    console.log({ result });
    return result;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return {
      url,
      type: "summarize-error",
    };
  }
}

const safeParse = (url: string, json?: string): {
  title: string;
  url: string;
  summary: string;
  tags: string[];
  type: 'success'
} | {
  url: string;
  type: 'parse-error';
} => {
  if (!json) {
    return {
      url,
      type: 'parse-error'
    };
  }
  try {
    return {
      ...JSON.parse(json),
      url,
      type: 'success'
    } as {
      title: string;
      url: string;
      summary: string;
      tags: string[];
      type: 'success'
    };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {
      url,
      type: 'parse-error'
    }
  }

}

// 実行例
// const url = "https://www3.nhk.or.jp/news/html/20240324/k10014401381000.html";
// summarizeWebPageWithStructuredJSON(url);