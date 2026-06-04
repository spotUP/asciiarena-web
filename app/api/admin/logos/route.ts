import { z } from "zod";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { revalidateTag } from "next/cache";
import { processAnsiUpload } from "@/lib/logoUpload";
import { measureAsciiText, checkLogoDims } from "@/lib/ansiDims";

const postSchema = z.object({
  ascii: z.string().min(1),
});

const deleteSchema = z.object({
  id: z.number().int().positive(),
});


export async function GET() {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rows = await prisma.$queryRaw<
    { id: number; author: string | null; ascii: string; kind: string; ansi_b64: string | null; font: string | null }[]
  >`
    SELECT logo_id AS id, author, ascii, kind, ansi_b64, font FROM logos ORDER BY logo_id DESC LIMIT 100
  `;
  return apiOk(rows);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  // ANSI logo upload (binary .ans) arrives as multipart/form-data.
  if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("ans");
    if (!(file instanceof File)) return apiError("An .ans file is required", 400);
    const fontValue = form.get("font");
    const result = await processAnsiUpload(file, typeof fontValue === "string" ? fontValue : null);
    if ("error" in result) return apiError(result.error, 400);
    await prisma.$executeRaw`INSERT INTO logos (ascii, kind, ansi_b64, font) VALUES ('', 'ansi', ${result.upload.ansiB64}, ${result.upload.font})`;
    revalidateTag("site:logos", "default");
    return apiOk({ status: true }, 201);
  }

  const rawPostBody = await request.json().catch(() => ({}));
  const postParsed = postSchema.safeParse(rawPostBody);
  if (!postParsed.success) return apiError("Invalid request: " + postParsed.error.issues[0]?.message, 400);
  if (!postParsed.data.ascii.trim()) return apiError("ascii content required", 400);

  const dimError = checkLogoDims(measureAsciiText(postParsed.data.ascii));
  if (dimError) return apiError(dimError, 400);

  await prisma.$executeRaw`INSERT INTO logos (ascii) VALUES (${postParsed.data.ascii})`;
  revalidateTag("site:logos", "default");
  return apiOk({ status: true }, 201);
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if ((session?.user as { rank?: string } | undefined)?.rank !== "Admin") return apiError("Forbidden", 403);

  const rawDeleteBody = await request.json().catch(() => ({}));
  const deleteParsed = deleteSchema.safeParse(rawDeleteBody);
  if (!deleteParsed.success) return apiError("Invalid request: " + deleteParsed.error.issues[0]?.message, 400);

  await prisma.$executeRaw`DELETE FROM logos WHERE logo_id = ${deleteParsed.data.id}`;
  revalidateTag("site:logos", "default");
  return apiOk({ status: true });
}
