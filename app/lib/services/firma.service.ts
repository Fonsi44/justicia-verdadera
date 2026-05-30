import { db } from "@/lib/db";
import { documents, documentVersions } from "@/database/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NotFoundError } from "@/lib/errors";

interface SignedDocument {
  documentId: string;
  version: number;
  fileUrl: string;
  signedAt: Date;
  provider: string;
}

interface FirmaProvider {
  signDocument(documentId: string, fileUrl: string, certificateId?: string): Promise<{
    success: boolean;
    signedFileUrl?: string;
    error?: string;
  }>;
}

class FirmaVirtualProvider implements FirmaProvider {
  async signDocument(documentId: string, fileUrl: string, certificateId?: string) {
    console.warn(
      `[FirmaVirtual] Stub: firmando documento ${documentId} desde ${fileUrl} (cert: ${certificateId ?? "default"})`,
    );
    return {
      success: true,
      signedFileUrl: fileUrl.replace(/\.[^.]+$/, "_firmado.pdf"),
    };
  }
}

class AcertaProvider implements FirmaProvider {
  async signDocument(documentId: string, fileUrl: string, certificateId?: string) {
    console.warn(
      `[Acerta] Stub: firmando documento ${documentId} desde ${fileUrl} (cert: ${certificateId ?? "default"})`,
    );
    return {
      success: true,
      signedFileUrl: fileUrl.replace(/\.[^.]+$/, "_firmado_acerta.pdf"),
    };
  }
}

class GseProvider implements FirmaProvider {
  async signDocument(documentId: string, fileUrl: string, certificateId?: string) {
    console.warn(
      `[GSE] Stub: firmando documento ${documentId} desde ${fileUrl} (cert: ${certificateId ?? "default"})`,
    );
    return {
      success: true,
      signedFileUrl: fileUrl.replace(/\.[^.]+$/, "_firmado_gse.pdf"),
    };
  }
}

export function getFirmaProvider(): FirmaProvider {
  const provider = process.env.FIRMA_ELECTRONICA_PROVIDER ?? "firma_virtual";
  switch (provider) {
    case "acerta":
      return new AcertaProvider();
    case "gse":
      return new GseProvider();
    case "firma_virtual":
    default:
      return new FirmaVirtualProvider();
  }
}

export async function signDocument(
  documentId: string,
  firmId: string,
  certificateId?: string,
): Promise<SignedDocument> {
  const [doc] = await db
    .select({
      id: documents.id,
      firmId: documents.firmId,
      name: documents.name,
      currentVersion: documents.currentVersion,
    })
    .from(documents)
    .where(
      and(eq(documents.id, documentId), eq(documents.firmId, firmId), isNull(documents.deletedAt)),
    )
    .limit(1);

  if (!doc) throw new NotFoundError("Documento");

  const [latestVersion] = await db
    .select({
      fileUrl: documentVersions.fileUrl,
      mimeType: documentVersions.mimeType,
    })
    .from(documentVersions)
    .where(eq(documentVersions.documentId, documentId))
    .orderBy(desc(documentVersions.version))
    .limit(1);

  if (!latestVersion) {
    throw new NotFoundError("Versión del documento");
  }

  const provider = getFirmaProvider();
  const result = await provider.signDocument(documentId, latestVersion.fileUrl, certificateId);

  if (!result.success || !result.signedFileUrl) {
    throw new Error(result.error ?? "Error al firmar documento");
  }

  const newVersion = doc.currentVersion + 1;

  await db.insert(documentVersions).values({
    documentId: doc.id,
    version: newVersion,
    fileUrl: result.signedFileUrl,
    fileKey: "",
    fileSize: 0,
    mimeType: latestVersion.mimeType ?? "application/pdf",
    changes: "Documento firmado electrónicamente",
  });

  await db
    .update(documents)
    .set({ currentVersion: newVersion, status: "firmado" })
    .where(eq(documents.id, documentId));

  return {
    documentId: doc.id,
    version: newVersion,
    fileUrl: result.signedFileUrl,
    signedAt: new Date(),
    provider: process.env.FIRMA_ELECTRONICA_PROVIDER ?? "firma_virtual",
  };
}

export type { FirmaProvider, SignedDocument };
