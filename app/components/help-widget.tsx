"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  HelpCircle,
  Search,
  ArrowLeft,
  Bot,
  FileText,
  Calendar,
  Receipt,
  Rocket,
} from "lucide-react";
import { searchHelp } from "@/lib/help-content";
import type { HelpCategory, HelpArticle, HelpSearchResult } from "@/lib/help-content";

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket,
  Receipt,
  FileText,
  Calendar,
  Bot,
};

function getPageContext(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  if (path.startsWith("/casos")) return "casos";
  if (path.startsWith("/clientes")) return "clientes";
  if (path.startsWith("/documentos")) return "documentos";
  if (path.startsWith("/agenda")) return "agenda";
  if (path.startsWith("/facturacion")) return "facturacion";
  if (path.startsWith("/config")) return "configuracion";
  if (path.startsWith("/dashboard")) return "dashboard";
  return null;
}

const PAGE_SUGGESTIONS: Record<string, { categoryId: string; title: string }[]> = {
  casos: [
    { categoryId: "primeros-pasos", title: "¿Cómo crear un caso?" },
    { categoryId: "primeros-pasos", title: "¿Cómo subir un documento?" },
    { categoryId: "ia-juridica", title: "Análisis de documentos con IA" },
  ],
  clientes: [{ categoryId: "primeros-pasos", title: "¿Cómo registrarme?" }],
  documentos: [
    { categoryId: "documentos", title: "¿Cómo funciona el OCR?" },
    { categoryId: "documentos", title: "Búsqueda en documentos" },
  ],
  agenda: [{ categoryId: "agenda", title: "Eventos y recordatorios" }],
  facturacion: [
    { categoryId: "facturacion", title: "¿Cómo crear una factura?" },
    { categoryId: "facturacion", title: "Facturación SAR-compliant" },
  ],
  configuracion: [{ categoryId: "primeros-pasos", title: "¿Cómo registrarme?" }],
};

type ViewState =
  | { view: "home" }
  | { view: "search" }
  | { view: "category"; category: HelpCategory }
  | { view: "article"; category: HelpCategory; article: HelpArticle };

export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<HelpSearchResult[]>([]);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [view, setView] = useState<ViewState>({ view: "home" });

  useEffect(() => {
    if (open) {
      fetch("/api/help/categories")
        .then((r) => r.json())
        .then((d) => setCategories(d.data ?? []))
        .catch(() => {});
    }
  }, [open]);

  const pageContext = getPageContext();
  const suggestions = pageContext ? PAGE_SUGGESTIONS[pageContext] ?? [] : [];

  const handleSearch = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (!q.trim()) {
        setSearchResults([]);
        setView({ view: "home" });
        return;
      }
      const results = searchHelp(q);
      setSearchResults(results);
      setView({ view: "search" });
    },
    []
  );

  const openCategory = useCallback(
    (categoryId: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (cat) setView({ view: "category", category: cat });
    },
    [categories]
  );

  const openArticle = useCallback(
    (categoryId: string, articleTitle: string) => {
      const cat = categories.find((c) => c.id === categoryId);
      if (!cat) return;
      const article = cat.articles.find((a) => a.title === articleTitle);
      if (article) setView({ view: "article", category: cat, article });
    },
    [categories]
  );

  const resetView = useCallback(() => {
    setView({ view: "home" });
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const CurrentIcon = useMemo(() => {
    if (view.view === "category" || view.view === "article") {
      return ICON_MAP[view.category.icon] ?? HelpCircle;
    }
    return HelpCircle;
  }, [view]);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          resetView();
        }}
        className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        size="icon"
        aria-label="Ayuda"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) resetView();
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {(view.view === "category" || view.view === "article") && (
                <button
                  onClick={() => {
                    if (view.view === "article") {
                      setView({ view: "category", category: view.category });
                    } else {
                      resetView();
                    }
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Atrás"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <CurrentIcon className="h-4 w-4 text-primary" />
              {view.view === "article"
                ? view.article.title
                : view.view === "category"
                  ? view.category.name
                  : "Centro de Ayuda"}
            </DialogTitle>
          </DialogHeader>

          {view.view === "article" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {view.article.content}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en la ayuda..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {view.view === "search" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">
                    {searchResults.length} resultado(s)
                  </p>
                  {searchResults.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No se encontraron resultados para &quot;{searchQuery}&quot;
                    </p>
                  )}
                  {searchResults.map((r) => (
                    <button
                      key={r.title}
                      onClick={() => openArticle(r.categoryId, r.title)}
                      className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {r.snippet}
                      </p>
                      <span className="text-[10px] text-primary mt-1 block">
                        {r.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {view.view === "home" && !searchQuery && (
                <>
                  {suggestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground font-medium">
                        Sugerencias para esta página
                      </p>
                      {suggestions.map((s) => (
                        <button
                          key={s.title}
                          onClick={() => openCategory(s.categoryId)}
                          className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors border"
                        >
                          <p className="text-sm font-medium">{s.title}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      Categorías
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((cat) => {
                        const Icon = ICON_MAP[cat.icon] ?? HelpCircle;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => openCategory(cat.id)}
                            className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                          >
                            <Icon className="h-6 w-6 text-primary" />
                            <span className="text-xs font-medium text-center">
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {view.view === "category" && (
                <div className="space-y-2">
                  {view.category.articles.map((article) => (
                    <button
                      key={article.title}
                      onClick={() =>
                        setView({
                          view: "article",
                          category: view.category,
                          article,
                        })
                      }
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <p className="text-sm font-medium">{article.title}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
