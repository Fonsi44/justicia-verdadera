const CHUNK_SIZE = 512;
const CHUNK_OVERLAP = 50;

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= size) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + size;

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    const boundaryChar = text[end];
    if (boundaryChar !== " " && boundaryChar !== "\n" && boundaryChar !== ".") {
      const lastSpace = text.lastIndexOf(" ", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const lastPeriod = text.lastIndexOf(".", end);
      const breakAt = Math.max(lastSpace, lastNewline, lastPeriod);
      if (breakAt > start) end = breakAt;
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
    if (start <= 0 || start >= text.length) break;
  }

  return chunks.filter((c) => c.length > 0);
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkWithMetadata(
  source: string,
  title: string,
  content: string,
  size = CHUNK_SIZE,
  overlap = CHUNK_OVERLAP
): Array<{ source: string; title: string; content: string; chunkIndex: number }> {
  const chunks = chunkText(content, size, overlap);
  return chunks.map((chunk, i) => ({
    source,
    title,
    content: chunk,
    chunkIndex: i,
  }));
}
