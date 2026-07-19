/**
 * Resume Parser API
 * Handles PDF and DOCX file uploads, extracts text content
 * Using unpdf for PDF parsing (same as apply.io)
 */

import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";

/**
 * Extract text from PDF using unpdf
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buffer), { mergePages: true });
  return text;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = "";

    // Parse based on file type
    if (fileName.endsWith(".pdf")) {
      try {
        extractedText = await extractPdfText(buffer);
      } catch (pdfError) {
        console.error("[Resume Parse] PDF extraction error:", pdfError);
        return NextResponse.json(
          { error: "Failed to read PDF. Please ensure it's a valid PDF file." },
          { status: 400 }
        );
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { error: "Could not extract text from PDF. It may be an image-based PDF." },
          { status: 400 }
        );
      }
    } else if (fileName.endsWith(".docx") || fileName.endsWith(".doc")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOCX, or TXT." },
        { status: 400 }
      );
    }

    // Clean up the extracted text
    const cleanedText = cleanResumeText(extractedText);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileSize: file.size,
      extractedText: cleanedText,
    });
  } catch (error) {
    console.error("[Resume Parse] Error:", error);
    return NextResponse.json(
      { error: "Failed to parse resume", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * Clean up extracted resume text
 */
function cleanResumeText(text: string): string {
  return text
    // Remove excessive whitespace
    .replace(/\s+/g, " ")
    // Remove multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    // Trim
    .trim()
    // Limit length (for token limits)
    .slice(0, 8000);
}
