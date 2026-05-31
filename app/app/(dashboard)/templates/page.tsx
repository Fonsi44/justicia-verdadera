"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Scale,
  Gavel,
  FileSignature,
  FilePen,
  BookOpen,
  Loader2,
  Send,
} from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Template = {
  id: string;
  type: string;
  name: string;
  description: string;
  estructura: string[];
  materias: string[];
  basePrompt: string;
};

type Case = {
  id: string;
  number: string;
  title: string;
  matter: string;
};

const typeIcons: Record<string, typeof FileText> = {
  demanda: Scale,
  contestacion: Gavel,
  recurso: FilePen,
  contrato: FileSignature,
  poder: FileSignature,
  escrito: FilePen,
  informe: BookOpen,
};

const typeLabels: Record<string, string> = {
  demanda: "Demandas",
  contestacion: "Contestaciones",
  recurso: "Recursos",
  contrato: "Contratos",
  poder: "Poderes",
  escrito: "Escritos",
  informe: "Informes",
};

const typeOrder = ["demanda", "contestacion", "recurso", "contrato", "poder", "escrito", "informe"];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Template | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string>("demanda");

  useEffect(() => {
    Promise.all([
      fetch("/api/legal/documents?limit=1").then(() => {
        // Import client-side templates from the API or use built-in
        return [];
      }),
      fetch("/api/cases?limit=100").then((r) => r.json()),
    ])
      .then(([, casesData]) => {
        setCases(casesData.data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Built-in template catalog (loaded from lib)
  useEffect(() => {
    fetch("/api/legal/search?q=tipos&limit=1")
      .then(() => {/* templates are client-side */})
      .catch(() => {});
  }, []);

  // Load templates from imported definition
  useEffect(() => {
    async function load() {
      const { TEMPLATES } = await import("@/lib/ai/templates");
      setTemplates(TEMPLATES);
    }
    load();
  }, []);

  const grouped = typeOrder
    .map((type) => ({ type, items: templates.filter((t) => t.type === type) }))
    .filter((g) => g.items.length > 0);

  async function handleGenerate() {
    if (!selected || !selectedCaseId) return;
    setGenerating(true);
    setGeneratedDoc(null);
    setGeneratedId(null);

    try {
      const res = await fetch(`/api/ai/generate-stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selected.id,
          caseId: selectedCaseId,
          customPrompt: customPrompt || undefined,
        }),
      });

      if (!res.ok) throw new Error("Error al generar");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream");

      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      setGeneratedDoc(text);
    } catch {
      setGeneratedDoc("Error al generar el borrador. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveAsDocument() {
    if (!generatedDoc) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: selectedCaseId,
          name: `${selected?.name || "Documento"} - ${new Date().toLocaleDateString()}`,
          type: selected?.type === "demanda" ? "demanda" :
                selected?.type === "recurso" ? "recurso" :
                selected?.type === "contrato" ? "contrato" :
                selected?.type === "contestacion" ? "contestacion" : "otro",
          status: "borrador",
          ocrText: generatedDoc,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedId(data.data?.id || data.id);
      }
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantillas Legales"
        description="Catálogo de 30 plantillas para generar borradores con IA"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Plantillas" }]}
      />

      <Tabs value={activeType} onValueChange={setActiveType} className="w-full">
        <TabsList className="flex-wrap h-auto">
          {grouped.map((g) => (
            <TabsTrigger key={g.type} value={g.type} className="flex items-center gap-1.5">
              {typeLabels[g.type]}
              <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {g.items.length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {grouped.map((g) => (
          <TabsContent key={g.type} value={g.type} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((template) => {
                const Icon = typeIcons[template.type] || FileText;
                return (
                  <Dialog key={template.id}>
                    <DialogTrigger
                      onClick={() => { setSelected(template); setGeneratedDoc(null); setGeneratedId(null); }}
                      className="group relative flex w-full flex-col items-start gap-3 rounded-xl border bg-card p-5 text-left ring-1 ring-foreground/10 transition-all hover:shadow-md hover:border-primary/30 cursor-pointer"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {template.materias.map((m) => (
                          <span key={m} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {m}
                          </span>
                        ))}
                      </div>
                    </DialogTrigger>

                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          {template.name}
                        </DialogTitle>
                      </DialogHeader>

                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{template.description}</p>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Estructura</p>
                          <ol className="list-inside list-disc space-y-1">
                            {template.estructura.map((e, i) => (
                              <li key={i} className="text-sm text-foreground">{e}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seleccionar Caso</label>
                          <select
                            value={selectedCaseId}
                            onChange={(e) => setSelectedCaseId(e.target.value)}
                            className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Selecciona un caso...</option>
                            {cases.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.number} — {c.title} ({c.matter})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Indicaciones adicionales (opcional)</label>
                          <Textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Ej: Incluir cláusula de confidencialidad..."
                            className="min-h-[60px] resize-none"
                          />
                        </div>

                        <Button
                          onClick={handleGenerate}
                          disabled={generating || !selectedCaseId}
                          className="w-full"
                        >
                          {generating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</>
                          ) : (
                            <><Send className="mr-2 h-4 w-4" />Generar Borrador</>
                          )}
                        </Button>

                        {generatedDoc && (
                          <div className="space-y-3">
                            <div className="rounded-lg border bg-muted p-4 max-h-64 overflow-y-auto">
                              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">{generatedDoc}</pre>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedDoc)} className="flex-1">
                                Copiar al portapapeles
                              </Button>
                              <Button onClick={handleSaveAsDocument} className="flex-1">
                                {generatedId ? "✅ Guardado" : "Guardar como Documento"}
                              </Button>
                            </div>
                            {generatedId && (
                              <p className="text-center text-xs text-muted-foreground">
                                Documento guardado. <a href={`/documentos/${generatedId}`} className="text-primary underline">Ver detalle</a>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
