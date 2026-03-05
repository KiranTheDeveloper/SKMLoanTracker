import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { extractDocumentData } from "@/lib/gemini";
import { readFile } from "fs/promises";
import path from "path";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  // Mark as processing
  await prisma.document.update({
    where: { id },
    data: { extractionStatus: "PROCESSING" },
  });

  try {
    const filePath = path.join(process.cwd(), "public", doc.filePath);
    const fileBuffer = await readFile(filePath);

    const extracted = await extractDocumentData(fileBuffer, doc.mimeType);

    // Update document with extracted data
    await prisma.document.update({
      where: { id },
      data: {
        extractionStatus: "COMPLETED",
        extractedData: JSON.stringify(extracted),
        extractionError: null,
      },
    });

    // Auto-populate customer fields if they're empty
    if (doc.customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: doc.customerId },
        select: {
          aadhaarNo: true, panNo: true, dob: true, gender: true,
          address: true, city: true, state: true, pincode: true,
          bankName: true, bankAccountNo: true, ifscCode: true,
          gstNo: true, occupation: true, employerName: true, monthlyIncome: true,
        },
      });

      if (customer) {
        const updates: Record<string, string | number> = {};

        // Identity fields
        if (!customer.aadhaarNo && extracted.aadhaarNo) updates.aadhaarNo = extracted.aadhaarNo;
        if (!customer.panNo && extracted.panNo) updates.panNo = extracted.panNo;
        if (!customer.dob && extracted.dob) updates.dob = extracted.dob;
        if (!customer.gender && extracted.gender) updates.gender = extracted.gender;

        // Address fields
        if (!customer.address && extracted.address) updates.address = extracted.address;
        if (!customer.city && extracted.city) updates.city = extracted.city;
        if (!customer.state && extracted.state) updates.state = extracted.state;
        if (!customer.pincode && extracted.pincode) updates.pincode = extracted.pincode;

        // Bank fields
        if (!customer.bankName && extracted.bankName) updates.bankName = extracted.bankName;
        if (!customer.bankAccountNo && extracted.accountNo) updates.bankAccountNo = extracted.accountNo;
        if (!customer.ifscCode && extracted.ifscCode) updates.ifscCode = extracted.ifscCode;

        // Business / income fields
        if (!customer.gstNo && extracted.gstNo) updates.gstNo = extracted.gstNo;
        if (!customer.employerName && extracted.companyName) updates.employerName = extracted.companyName;
        if (!customer.occupation && extracted.designation) updates.occupation = extracted.designation;

        // Income — use net salary if available, else gross
        if (!customer.monthlyIncome) {
          const incomeStr = extracted.netSalary || extracted.grossSalary || extracted.grossIncome;
          if (incomeStr) {
            const parsed = parseFloat(incomeStr.replace(/,/g, ""));
            if (!isNaN(parsed) && parsed > 0) updates.monthlyIncome = parsed;
          }
        }

        if (Object.keys(updates).length > 0) {
          await prisma.customer.update({
            where: { id: doc.customerId },
            data: updates,
          });
        }
      }
    }

    const updatedDoc = await prisma.document.findUnique({ where: { id } });
    return NextResponse.json({ doc: updatedDoc, extracted });
  } catch (err) {
    console.error("Extraction error:", err);
    await prisma.document.update({
      where: { id },
      data: {
        extractionStatus: "FAILED",
        extractionError: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return NextResponse.json(
      { error: "Extraction failed", detail: err instanceof Error ? err.message : "Unknown" },
      { status: 500 }
    );
  }
}
