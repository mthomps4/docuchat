import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { addDocumentsToVectorStore, reindexAllDocuments } from "./vector-store";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

interface ProcessResult {
  success: boolean;
  metadata?: {
    fileName?: string;
    pageCount?: number;
    chunkCount?: number;
    documentCount?: number;
  };
  error?: string;
}

export async function processDocument(file: File): Promise<ProcessResult> {
  try {
    // Create a temporary file path or handle the File object directly
    const loader = new PDFLoader(file);
    const docs = await loader.load();

    // Split text into chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await textSplitter.splitDocuments(docs);

    // Add metadata
    const docsWithMetadata = chunks.map((doc) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        source: file.name,
        uploadedAt: new Date().toISOString(),
      },
    }));

    // Add to vector store
    await addDocumentsToVectorStore(docsWithMetadata);

    return {
      success: true,
      metadata: {
        fileName: file.name,
        pageCount: docs.length,
        chunkCount: chunks.length,
      },
    };
  } catch (error) {
    console.error("Error processing document:", error);
    throw error;
  }
}

export async function reindexDocuments(): Promise<ProcessResult> {
  try {
    // Get all documents from storage
    const documents: Document[] = []; // Add your document fetching logic

    // Reindex
    await reindexAllDocuments(documents);

    return {
      success: true,
      metadata: {
        documentCount: documents.length,
        chunkCount: documents.length,
      },
    };
  } catch (error) {
    console.error("Error reindexing documents:", error);
    throw error;
  }
}
