const FETCH_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface FetchOptions {
  url: string;
  timeout?: number;
  retries?: number;
}

interface FetchResult {
  html: string;
  url: string;
  status: number;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchUrl(opts: FetchOptions): Promise<FetchResult> {
  const timeout = opts.timeout ?? FETCH_TIMEOUT;
  const maxRetries = opts.retries ?? MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(opts.url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "JusticiaVerdadera/1.0 (LegalCorpusBot; +https://justiciaverdadera.com)",
          "Accept": "text/html,application/pdf,application/xhtml+xml,*/*",
          "Accept-Language": "es-HN,es;q=0.9,en;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      return {
        html: text,
        url: response.url,
        status: response.status,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      if (attempt === maxRetries) {
        throw new Error(
          `Error fetching ${opts.url} after ${maxRetries} attempts: ${error instanceof Error ? error.message : error}`
        );
      }

      console.warn(`[Scraper] Attempt ${attempt}/${maxRetries} failed for ${opts.url}, retrying in ${RETRY_DELAY_MS}ms...`);
      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(`Failed to fetch ${opts.url} after ${maxRetries} attempts`);
}

export async function fetchWithRateLimit(
  urls: string[],
  requestsPerMinute = 10
): Promise<FetchResult[]> {
  const results: FetchResult[] = [];
  const delayMs = Math.ceil(60000 / requestsPerMinute);

  for (const url of urls) {
    try {
      const result = await fetchUrl({ url });
      results.push(result);
      console.log(`[Scraper] OK ${url} — ${result.status}`);
    } catch (error) {
      console.error(`[Scraper] FAIL ${url} — ${error instanceof Error ? error.message : error}`);
    }

    if (urls.indexOf(url) < urls.length - 1) {
      await delay(delayMs);
    }
  }

  return results;
}
