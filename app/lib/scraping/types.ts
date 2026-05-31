export interface LegalSource {
  id: string;
  name: string;
  category: "codigo" | "ley" | "reglamento" | "constitucion" | "jurisprudencia" | "tratado";
  urls: string[];
  selectors?: Record<string, string>;
  priority: number;
  description: string;
}

export interface ScrapedDocument {
  source: string;
  title: string;
  content: string;
  metadata?: {
    fecha?: string;
    sala?: string;
    ponente?: string;
    fuenteUrl?: string;
    numero?: string;
    articulos?: string[];
  };
}

export interface ScrapingResult {
  sourceId: string;
  documentsScraped: number;
  chunksStored: number;
  errors: string[];
  duration: number;
}

export const SOURCE_CATEGORIES = {
  codigo: "Códigos",
  ley: "Leyes",
  reglamento: "Reglamentos",
  constitucion: "Constitución",
  jurisprudencia: "Jurisprudencia CSJ",
  tratado: "Tratados Internacionales",
} as const;
