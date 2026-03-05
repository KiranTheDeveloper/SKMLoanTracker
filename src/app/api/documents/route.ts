import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const customerId = formData.get("customerId") as string | null;
    const applicationId = formData.get("applicationId") as string | null;
    const docType = formData.get("docType") as string | null;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }
    if (!customerId && !applicationId) {
      return NextResponse.json({ error: "customerId or applicationId required" }, { status: 400 });
    }

    const folderId = customerId || applicationId!;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folderId);
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop();
    const slug = (docType || "doc").replace(/\s+/g, "_");
    const filename = `${slug}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const relativePath = `/uploads/${folderId}/${filename}`;

    const doc = await prisma.document.create({
      data: {
        customerId: customerId || null,
        applicationId: applicationId || null,
        filename,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        filePath: relativePath,
        docType: docType || null,
        extractionStatus: "PENDING",
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json(doc, { status: 201 });
  } catch (err) {
    console.error("Document upload error:", err);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
