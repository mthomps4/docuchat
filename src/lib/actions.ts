"use server";

import { generateAnswer } from "./chat-service";
import { processDocument, reindexDocuments } from "./document-service";
import { writeFile } from "fs/promises";
import path from "path";
import { DOCUMENTS_DIR } from "./constants";
import { getAllDocuments, processPdfDocument } from "./document-processor";
import { reindexAllDocuments } from "./vector-store";
import fs from "fs/promises";

export async function handleChatQuery(query: string) {
  try {
    return await generateAnswer(query);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function handleDocumentUpload(file: File) {
  try {
    // Ensure directory exists
    await fs.mkdir(DOCUMENTS_DIR, { recursive: true });

    const filePath = path.join(DOCUMENTS_DIR, file.name);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save file
    await writeFile(filePath, buffer);
    console.log(`Saved file to: ${filePath}`);

    // Process document
    const result = await processPdfDocument(filePath);
    return result;
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function handleReindex() {
  try {
    console.log("Starting reindex process"); // Debug log
    const allDocs = await getAllDocuments();
    console.log(`Found ${allDocs.length} documents to reindex`); // Debug log

    if (allDocs.length === 0) {
      return {
        success: true,
        metadata: {
          documentCount: 0,
          chunkCount: 0,
          message:
            "No documents found in storage. Please upload some documents first.",
        },
      };
    }

    await reindexAllDocuments(allDocs);

    const uniqueDocs = new Set(allDocs.map((doc) => doc.metadata.source)).size;

    return {
      success: true,
      metadata: {
        documentCount: uniqueDocs,
        chunkCount: allDocs.length,
        message: `Successfully reindexed ${uniqueDocs} documents with ${allDocs.length} total chunks.`,
      },
    };
  } catch (error) {
    console.error("Error in handleReindex:", error); // Debug log
    throw error;
  }
}
