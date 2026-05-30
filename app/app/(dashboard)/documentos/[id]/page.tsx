import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

interface DocumentDetail {
  id: string;
  name: string;
  type: string;
  currentVersion: number;
  status: string;
  ocrText: string | null;
  processingStatus: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  case: { id: string; number: string; title: string } | null;
}

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

const statusLabels: Record<string, string> = {
  borrador: "Borrador",
  final: "Final",
  firmado: "Firmado",
  archivado: "Archivado",
};

const processingStatusLabels: Record<string, string> = {
  pending: "Pendiente",
  uploaded: "Subido",
  ocr_processing: "Procesando OCR",
  ocr_complete: "OCR Completado",
  ocr_skipped: "OCR Omitido",
  manual_review: "Revisión Manual",
  error: "Error",
  retry_pending: "Reintento Pendiente",
};

const processingStatusVariants: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  uploaded: "bg-sky-500/10 text-sky-700",
  ocr_processing: "bg-amber-500/10 text-amber-700",
  ocr_complete: "bg-emerald-500/10 text-emerald-700",
  ocr_skipped: "bg-muted text-muted-foreground",
  manual_review: "bg-orange-500/10 text-orange-700",
  error: "bg-red-500/10 text-red-700",
  retry_pending: "bg-amber-500/10 text-amber-700",
};

async function getDocument(id: string): Promise<DocumentDetail | null> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/documents/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Error fetching document: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

const statusColors: Record<string, string> = {
  borrador: "bg-muted text-muted-foreground",
  final: "bg-emerald-500/10 text-emerald-700",
  firmado: "bg-sky-500/10 text-sky-700",
  archivado: "bg-muted text-muted-foreground",
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const doc = await getDocument(id);

  if (!doc) {
    notFound();
  }

  const procStatus = doc.processingStatus || "pending";
  const isOcrComplete = procStatus === "ocr_complete";
  const isOcrProcessing = procStatus === "ocr_processing";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/documentos"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Volver a documentos"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {doc.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detalle del documento
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
        <div className="divide-y">
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nombre
              </p>
              <p className="text-sm font-medium text-foreground">{doc.name}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Tipo
              </p>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {typeLabels[doc.type] ?? doc.type}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estado
              </p>
              <span
                className={
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                  (statusColors[doc.status] ?? "bg-muted text-muted-foreground")
                }
              >
                {statusLabels[doc.status] ?? doc.status}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Versión actual
              </p>
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                v{doc.currentVersion}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Caso vinculado
              </p>
              {doc.case ? (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {doc.case.title}
                  </span>
                  <span className="font-mono text-xs text-primary">
                    {doc.case.number}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground/60">
                  Sin caso vinculado
                </span>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Procesamiento OCR
              </p>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium " +
                  (processingStatusVariants[procStatus] ??
                    "bg-muted text-muted-foreground")
                }
              >
                {isOcrProcessing && (
                  <span className="inline-block h-1.5 w-1.5 animate-ping rounded-full bg-amber-500" />
                )}
                {isOcrComplete && <CheckCircle2 className="h-3 w-3" />}
                {procStatus === "error" && <AlertCircle className="h-3 w-3" />}
                {procStatus === "ocr_skipped" && <EyeOff className="h-3 w-3" />}
                {processingStatusLabels[procStatus] ?? procStatus}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="mr-1 inline-block h-3 w-3" />
                Creado
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(doc.createdAt)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Clock className="mr-1 inline-block h-3 w-3" />
                Actualizado
              </p>
              <p className="text-sm text-foreground">
                {formatDateTime(doc.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card ring-1 ring-foreground/10">
        <div className="p-6">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Texto extraído (OCR)
          </h2>

          {isOcrComplete && doc.ocrText ? (
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap break-words rounded bg-muted p-4 text-xs leading-relaxed text-muted-foreground">
              {doc.ocrText}
            </pre>
          ) : isOcrProcessing ? (
            <div className="flex items-center gap-3 rounded bg-muted p-4 text-sm text-muted-foreground">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              Procesando OCR...
            </div>
          ) : procStatus === "error" ? (
            <div className="flex items-center gap-2 rounded bg-red-500/10 p-4 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              El procesamiento OCR encontró un error.
            </div>
          ) : procStatus === "ocr_skipped" ? (
            <div className="flex items-center gap-2 rounded bg-muted p-4 text-sm text-muted-foreground">
              <EyeOff className="h-4 w-4 shrink-0" />
              OCR omitido — el tipo de archivo no es compatible para
              extracción automática.
            </div>
          ) : (
            <div className="rounded bg-muted p-4 text-sm text-muted-foreground">
              No hay texto OCR disponible. Estado:{" "}
              {processingStatusLabels[procStatus] ?? procStatus}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/documentos">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a documentos
          </Button>
        </Link>
      </div>
    </div>
  );
}
