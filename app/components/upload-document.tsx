"use client";

import { useRouter } from "next/navigation";
import { UploadDropzone } from "@uploadthing/react";
import { toast } from "sonner";
import type { OurFileRouter } from "@/lib/uploadthing";

interface UploadDocumentProps {
  caseId?: string;
  onSuccess?: () => void;
}

export default function UploadDocument({ caseId, onSuccess }: UploadDocumentProps) {
  const router = useRouter();

  return (
    <UploadDropzone<OurFileRouter, "documentUploader">
      endpoint="documentUploader"
      config={{ mode: "auto" }}
      onClientUploadComplete={async (res) => {
        const file = res?.[0];
        if (!file) return;

        try {
          const body: Record<string, unknown> = {
            name: file.name,
            type: "otro",
            mimeType: file.type,
            fileUrl: file.url,
            fileKey: file.key,
            fileSize: file.size,
          };
          if (caseId) body.caseId = caseId;

          const r = await fetch("/api/documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

          if (!r.ok) {
            const err = await r.json();
            throw new Error(err.error ?? "Error al guardar el documento");
          }

          const doc = await r.json();
          toast.success("Documento subido correctamente");
          onSuccess?.();
          router.refresh();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al procesar el documento");
        }
      }}
      onUploadError={(error: Error) => {
        toast.error(error.message ?? "Error al subir el archivo");
      }}
      content={{
        allowedContent: "PDF, JPG, PNG, TIFF — max 8MB",
      }}
    />
  );
}
