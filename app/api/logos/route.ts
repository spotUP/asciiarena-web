import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiError, apiOk } from "@/lib/utils";
import { Prisma } from "@/lib/generated/prisma/client";
import { revalidateTag } from "next/cache";
import { processAnsiUpload } from "@/lib/logoUpload";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  // ANSI logo upload (binary .ans file) arrives as multipart/form-data.
  if ((request.headers.get("content-type") ?? "").includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("ans");
    if (!(file instanceof File)) return apiError("An .ans file is required", 400);
    const fontValue = form.get("font");
    const result = await processAnsiUpload(file, typeof fontValue === "string" ? fontValue : null);
    if ("error" in result) return apiError(result.error, 400);
    const author = String(form.get("author") ?? "").trim();
    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO logos (author, ascii, kind, ansi_b64, font) VALUES (${author}, '', 'ansi', ${result.upload.ansiB64}, ${result.upload.font})`
    );
    revalidateTag("site:logos", "default");
    return apiOk({ status: true }, 201);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return apiError("Invalid JSON body", 400);
  }

  const author = String(body.author ?? "").trim();
  const ascii = String(body.ascii ?? "");

  if (!ascii) return apiError("ascii is required", 400);

  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO logos (author, ascii) VALUES (${author}, ${ascii})`
  );
  revalidateTag("site:logos", "default");

  return apiOk({ status: true }, 201);
}
