"use client";

import { useEffect, useState } from "react";
import { FileText, Search, Upload, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  case: { id: string; number: string; title: string } | null;
}

const typeColors: Record<string, string> = {
  demanda: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  contestacion: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  recurso: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  sentencia: "bg-green-500/10 text-green-400 border-green-500/20",
  contrato: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  poder: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  prueba: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  informe: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  otro: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const statusColors: Record<string, string> = {
  borrador: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  final: "bg-green-500/10 text-green-400 border-green-500/20",
  firmado: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  archivado: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

const typeLabels: Record<string, string> = {
  demanda: "Demanda",
  contestacion: "Contestación",
  recurso: "Recurso",
  sentencia: "Sentencia",
  contrato: "Contrato",
  poder: "Poder",
  prueba: "Prueba",
  informe: "Informe",
  otro: "Otro",
};

export default function DocumentosPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    fetch(`/api/documents?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => setDocuments(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, typeFilter]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#e8e4dd]">Documentos</h1>
        <p className="mt-1 text-sm text-[#8b8d91]">Gestiona todos los documentos de tu despacho</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91]" />
            <input
              type="text"
              placeholder="Buscar documentos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/[0.06] bg-[#0d1119] py-2.5 pl-10 pr-4 text-sm text-[#e8e4dd] placeholder:text-[#8b8d91] focus:outline-none focus:border-[#c8a45c]/40"
            />
          </div>
          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="appearance-none rounded-xl border border-white/[0.06] bg-[#0d1119] py-2.5 pl-4 pr-10 text-sm text-[#e8e4dd] focus:outline-none focus:border-[#c8a45c]/40"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b8d91] pointer-events-none" />
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-[#c8a45c] px-5 py-2.5 text-sm font-medium text-[#080b12] hover:bg-[#d4b36a] transition-colors">
          <Upload className="h-4 w-4" />
          Subir documento
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[#8b8d91]">Cargando documentos...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="h-10 w-10 text-[#8b8d91] mx-auto mb-3" />
            <p className="text-sm text-[#8b8d91]">No hay documentos registrados</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Nombre</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Tipo</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Caso vinculado</th>
                <th className="text-center px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Versión</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-[#8b8d91] uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#c8a45c]/5 border border-[#c8a45c]/10">
                        <FileText className="h-3.5 w-3.5 text-[#c8a45c]" />
                      </div>
                      <span className="text-sm text-[#e8e4dd] font-medium">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${typeColors[doc.type] ?? typeColors.otro}`}>
                      {typeLabels[doc.type] ?? doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusColors[doc.status]}`}>
                      {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#8b8d91]">
                    {doc.case ? (
                      <span className="text-[#c8a45c]">{doc.case.number}</span>
                    ) : (
                      <span className="text-[#5a5d62]">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-[#8b8d91]">v{doc.currentVersion}</td>
                  <td className="px-6 py-4 text-right text-sm text-[#8b8d91]">{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
