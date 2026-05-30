import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "8MB", maxFileCount: 1 },
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    text: { maxFileSize: "8MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.firmId) throw new Error("No autorizado");
      return { firmId: session.user.firmId, userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      if (process.env.NODE_ENV !== "production") {
        console.log("[UploadThing] File uploaded:", file.name, file.url);
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
