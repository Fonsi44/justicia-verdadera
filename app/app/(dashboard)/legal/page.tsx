"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  BookOpen,
  Search,
} from "lucide-react";
import PageHeader from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: { title: string; source: string }[];
};

export default function LegalPage() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Soy tu asistente jurídico. Pregúntame sobre leyes, códigos, jurisprudencia hondureña o analiza documentos de tus casos.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ title: string; content: string; source: string; similarity: number }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  async function handleChat(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/legal/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Error al procesar la consulta. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 3 || searchLoading) return;

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/legal/search?q=${encodeURIComponent(trimmed)}&limit=10`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSearchResults(data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asistente Jurídico IA"
        description="Consulta el corpus legal hondureño con DeepSeek V4"
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Asistente IA" }]}
      />

      <Tabs defaultValue="chat" className="w-full">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />Chat Jurídico
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />Búsqueda en Corpus
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="mt-6">
          <div className="flex flex-col rounded-xl border bg-card ring-1 ring-foreground/10">
            <div ref={chatRef} className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[400px] max-h-[500px]">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 border-t pt-2 border-foreground/10">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Fuentes:</p>
                        {msg.sources.map((s, j) => (
                          <p key={j} className="text-xs text-muted-foreground/80">📄 {s.title} <span className="opacity-60">({s.source})</span></p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Consultando corpus legal...</span>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4">
              <form onSubmit={handleChat} className="flex gap-2">
                <Textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ej: ¿Cuáles son los requisitos del Código Civil para un contrato de arrendamiento?"
                  className="min-h-[44px] flex-1 resize-none"
                  rows={1}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(e); } }}
                />
                <Button type="submit" disabled={loading || !query.trim()} className="shrink-0">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-4">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <Search className="absolute ml-3 mt-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en códigos, leyes y jurisprudencia..."
                className="w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <Button type="submit" disabled={searchLoading || searchQuery.trim().length < 3}>
                {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
              </Button>
            </form>

            {searchResults.length === 0 && !searchLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">Ingresa al menos 3 caracteres para buscar en el corpus legal</p>
              </div>
            )}

            {searchLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((r, i) => (
                  <div key={i} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm font-medium text-foreground">{r.title}</h3>
                      <span className="shrink-0 rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {(r.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground/60">{r.source}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">{r.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
