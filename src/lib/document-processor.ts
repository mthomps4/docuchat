"use server";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "@langchain/core/documents";
import { addDocumentsToVectorStore, reindexAllDocuments } from "./vector-store";
import path from "path";
import fs from "fs/promises";
import { DOCUMENTS_DIR } from "./constants";

interface ProcessResult {
  success: boolean;
  chunks?: number;
  error?: string;
  metadata?: {
    fileName?: string;
    pageCount?: number;
    chunkCount?: number;
    documentCount?: number;
    source?: string;
    message?: string;
  };
}

// Process PDF document
export async function processPdfDocument(
  filePath: string
): Promise<ProcessResult> {
  try {
    // Load the PDF
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();

    // Extract the file name for metadata
    const fileName = path.basename(filePath);

    // Add source metadata to each document
    const docsWithMetadata = docs.map((doc) => {
      doc.metadata = {
        ...doc.metadata,
        source: fileName,
        uploadedAt: new Date().toISOString(),
      };
      return doc;
    });

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await textSplitter.splitDocuments(docsWithMetadata);

    // Add to vector store
    await addDocumentsToVectorStore(chunks);

    return {
      success: true,
      chunks: chunks.length,
      metadata: {
        fileName,
        pageCount: docs.length,
        chunkCount: chunks.length,
      },
    };
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

// Get all documents from a directory
export async function getAllDocuments(): Promise<Document[]> {
  try {
    // Ensure directory exists
    try {
      await fs.access(DOCUMENTS_DIR);
    } catch {
      await fs.mkdir(DOCUMENTS_DIR, { recursive: true });
      console.log(`Created directory: ${DOCUMENTS_DIR}`);
      return [];
    }

    // Get all files in directory
    const files = await fs.readdir(DOCUMENTS_DIR);
    console.log("Found files:", files); // Debug log

    const pdfFiles = files.filter((file) =>
      file.toLowerCase().endsWith(".pdf")
    );
    console.log("PDF files:", pdfFiles); // Debug log

    const allDocs: Document[] = [];

    for (const file of pdfFiles) {
      const filePath = path.join(DOCUMENTS_DIR, file);
      console.log(`Processing: ${filePath}`); // Debug log

      try {
        const loader = new PDFLoader(filePath);
        const docs = await loader.load();
        console.log(`Loaded ${docs.length} pages from ${file}`); // Debug log

        // Add metadata
        const docsWithMetadata = docs.map((doc) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            source: file,
            uploadedAt: new Date().toISOString(),
          },
        }));

        // Split text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const chunks = await textSplitter.splitDocuments(docsWithMetadata);

        console.log(`Created ${chunks.length} chunks from ${file}`);
        allDocs.push(...chunks);
      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }

    console.log(`Total documents processed: ${pdfFiles.length}`);
    console.log(`Total chunks created: ${allDocs.length}`);
    return allDocs;
  } catch (error) {
    console.error("Error getting all documents:", error);
    throw error;
  }
}

// Update the reindex function
export async function triggerReindex(): Promise<ProcessResult> {
  try {
    // Get all documents from the documents directory
    const allDocs = await getAllDocuments();

    if (allDocs.length === 0) {
      return {
        success: true,
        chunks: 0,
        metadata: {
          documentCount: 0,
          chunkCount: 0,
          message:
            "No documents found in storage. Please upload some documents first.",
        },
      };
    }

    // Reindex the documents
    await reindexAllDocuments(allDocs);

    // Count unique documents
    const uniqueDocs = new Set(allDocs.map((doc) => doc.metadata.source)).size;

    return {
      success: true,
      chunks: allDocs.length,
      metadata: {
        documentCount: uniqueDocs,
        chunkCount: allDocs.length,
        message: `Successfully reindexed ${uniqueDocs} documents with ${allDocs.length} total chunks.`,
      },
    };
  } catch (error) {
    console.error("Error reindexing documents:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
