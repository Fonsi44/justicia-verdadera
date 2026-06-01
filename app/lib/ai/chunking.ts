// Chunking optimizado para documentos legales hondurenos
// Tamano: ~300 tokens (~1200 chars) para capturar articulos completos
// Overlap: 200 chars (~50 tokens) para continuidad semantica
// Separacion por "Artículo" como prioridad para mantener integridad legal
const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 200;

// Patron para detectar inicios de articulos en documentos legales
const ARTICLE_PATTERN = /\n\s*(?:Artículo|Art\.|Articulo)\s+\d+/gi;

function findArticleBoundary(text: string, end: number): number {
  const searchFrom = Math.max(0, end - 300);
  const beforeEnd = text.slice(searchFrom, end + 200);
  const matches = [...beforeEnd.matchAll(ARTICLE_PATTERN)];
  if (matches.length > 0) {
    for (let i = matches.length - 1; i >= 0; i--) {
      const pos = searchFrom + matches[i].index;
      if (pos > searchFrom + 100 && pos < end + 50) return pos;
    }
  }
  return -1;
}

export function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  if (!text || text.length === 0) return [];
  if (text.length <= size) return [text.trim()];

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + size, text.length);

    if (end >= text.length) {
      chunks.push(text.slice(start).trim());
      break;
    }

    // 1. Intentar cortar al inicio del proximo articulo
    const articleBoundary = findArticleBoundary(text, end);
    if (articleBoundary > start) {
      end = articleBoundary;
    } else {
      // 2. Buscar corte por punto y aparte (mejor que punto seguido)
      const paraEnd = text.lastIndexOf("\n\n", end);
      if (paraEnd > start + size * 0.5) {
        end = paraEnd;
      } else {
        // 3. Buscar ultimo punto con espacio (fin de oracion)
        const sentenceEnd = text.lastIndexOf(". ", end);
        if (sentenceEnd > start + size * 0.5) {
          end = sentenceEnd + 1;
        } else {
          // 4. Buscar ultimo salto de linea
          const newlineEnd = text.lastIndexOf("\n", end);
          if (newlineEnd > start) end = newlineEnd;
          // 5. Sino, partir en espacio
          else {
            const spaceEnd = text.lastIndexOf(" ", end);
            if (spaceEnd > start) end = spaceEnd;
          }
        }
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = Math.max(start + 1, end - overlap);
    if (start >= text.length) break;
  }

  return chunks.filter((c) => c.length > 50);
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
  // Prefijo contextual que identifica el documento en cada chunk
  const contextPrefix = `[Documento: ${title}] Fuente: ${source}\n\n`;
  const effectiveSize = size - contextPrefix.length;

  const rawChunks = chunkText(content, effectiveSize, overlap);
  return rawChunks.map((chunk, i) => ({
    source,
    title,
    content: contextPrefix + chunk,
    chunkIndex: i,
  }));
}
