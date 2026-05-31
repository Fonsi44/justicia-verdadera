import type { ScrapedDocument } from "./types";

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  return "Documento sin título";
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function extractArticles(content: string): string[] {
  const articleRegex = /Artículo\s+\d+[°º]?[\.\-–—]?\s*[^.]*\./gi;
  const matches = content.match(articleRegex);
  return matches || [];
}

export function parseHtmlDocument(source: string, html: string, url: string): ScrapedDocument {
  const title = extractTitle(html);
  const text = stripHtml(html);
  const articles = extractArticles(text);

  return {
    source,
    title,
    content: text.substring(0, 50000),
    metadata: {
      fuenteUrl: url,
      articulos: articles.length > 0 ? articles.slice(0, 50) : undefined,
    },
  };
}

export function parsePdfText(source: string, pdfText: string, title?: string, url?: string): ScrapedDocument {
  const cleanText = pdfText
    .replace(/\r\n/g, "\n")
    .replace(/\f/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const articles = extractArticles(cleanText);
  const docTitle = title || extractTitleFromContent(cleanText) || `${source} — Texto completo`;

  return {
    source,
    title: docTitle,
    content: cleanText.substring(0, 80000),
    metadata: {
      fuenteUrl: url,
      articulos: articles.length > 0 ? articles.slice(0, 100) : undefined,
    },
  };
}

function extractTitleFromContent(content: string): string | null {
  const lines = content.split("\n").filter((l) => l.trim().length > 10);
  for (const line of lines.slice(0, 10)) {
    const trimmed = line.trim();
    if (/^(TÍTULO|LIBRO|CAPÍTULO|LEY|CÓDIGO|DECRETO)/i.test(trimmed)) {
      return trimmed;
    }
  }
  return null;
}

export function detectContentType(headers: Record<string, string>, url: string): "html" | "pdf" | "unknown" {
  const contentType = (headers["content-type"] || "").toLowerCase();
  if (contentType.includes("pdf") || url.toLowerCase().endsWith(".pdf")) return "pdf";
  if (contentType.includes("html") || url.toLowerCase().endsWith(".html") || url.toLowerCase().endsWith(".htm")) return "html";
  return "html";
}
