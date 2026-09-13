import fs from "fs";
import path from "path";

// Polyfill DOMMatrix for Next.js server runtime which doesn't have it natively,
// but which pdf-parse's underlying pdf.js library assumes is present.
if (typeof global !== "undefined" && typeof global.DOMMatrix === "undefined") {
  (global as any).DOMMatrix = class DOMMatrix {};
}
const pdfParse = require("pdf-parse/lib/pdf-parse.js");
import { GoogleGenAI } from "@google/genai";
import { prisma } from "../prisma";
import { LocalVectorStore, DocumentChunk } from "./vectorStore";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const vectorStore = new LocalVectorStore();

// Basic chunking function
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // Try to break at a natural boundary like a paragraph or sentence
    if (endIndex < text.length) {
      const nextNewline = text.indexOf("\n\n", endIndex - 100);
      const nextPeriod = text.indexOf(". ", endIndex - 100);
      
      if (nextNewline !== -1 && nextNewline < endIndex + 200) {
        endIndex = nextNewline + 2;
      } else if (nextPeriod !== -1 && nextPeriod < endIndex + 200) {
        endIndex = nextPeriod + 2;
      }
    }
    
    chunks.push(text.substring(startIndex, endIndex).trim());
    startIndex = endIndex - overlap;
    
    if (startIndex < 0) startIndex = 0;
  }
  
  return chunks.filter(c => c.length > 50); // Filter out tiny chunks
}

export async function processMaterial(materialId: string) {
  try {
    const material = await prisma.material.findUnique({
      where: { id: materialId },
    });

    if (!material) {
      throw new Error(`Material ${materialId} not found`);
    }

    // Update status to processing
    await prisma.material.update({
      where: { id: materialId },
      data: { status: "PROCESSING" },
    });

    // Read file
    const filePath = path.join(process.cwd(), "public", "uploads", material.fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Parse PDF
    const data = await pdfParse(fileBuffer);
    const text = data.text;

    // Chunk text
    const chunks = chunkText(text);

    // Get embeddings from Gemini
    const docsToAdd: DocumentChunk[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: chunkText,
      });

      if (response.embeddings && response.embeddings[0].values) {
        docsToAdd.push({
          id: `${material.id}-chunk-${i}`,
          projectId: material.projectId,
          materialId: material.id,
          text: chunkText,
          embedding: response.embeddings[0].values,
        });
      }
    }

    // Save to Vector Store
    await vectorStore.addDocuments(docsToAdd);

    // Mark as completed
    await prisma.material.update({
      where: { id: materialId },
      data: { status: "COMPLETED" },
    });

    return { success: true, chunksProcessed: chunks.length };

  } catch (error) {
    console.error("Error processing material:", error);
    
    // Mark as error
    await prisma.material.update({
      where: { id: materialId },
      data: { status: "ERROR" },
    });
    
    throw error;
  }
}
