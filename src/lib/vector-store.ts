"use server";

import { ChromaClient } from "chromadb";
import { CohereEmbeddings } from "@langchain/cohere";
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

// Create embeddings instance
const cohereEmbeddings = new CohereEmbeddings({
  apiKey: process.env.COHERE_API_KEY,
  model: "embed-english-v3.0",
});

// Initialize Chroma client
const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});
const collectionName = "document_collection";

interface IEmbeddingFunction {
  generate: (texts: string[]) => Promise<number[][]>;
}

// Ensure collection exists
export async function initVectorStore(): Promise<void> {
  try {
    const collections = await chromaClient.listCollections();
    const exists = collections
      .map((c) => (c as unknown as { name: string }).name)
      .includes(collectionName);

    if (!exists) {
      await chromaClient.createCollection({ name: collectionName });
      console.log("Collection created successfully");
    } else {
      console.log("Collection already exists");
    }
  } catch (error) {
    console.error("Error initializing Chroma:", error);
    throw error;
  }
}

// Get the LangChain Chroma instance
export async function getVectorStore(): Promise<Chroma> {
  return new Chroma(cohereEmbeddings, { collectionName });
}

// Add documents to the vector store
export async function addDocumentsToVectorStore(
  documents: Document[]
): Promise<void> {
  const vectorStore = await getVectorStore();
  await vectorStore.addDocuments(documents);
}

// Query the vector store
export async function queryVectorStore(
  query: string,
  k = 3
): Promise<Document[]> {
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever({ k });
  return retriever.getRelevantDocuments(query);
}

// Reindex all documents
export async function reindexAllDocuments(
  documents: Document[]
): Promise<void> {
  try {
    // Delete existing collection if it exists
    const collections = await chromaClient.listCollections();
    const exists = collections
      .map((c) => (c as unknown as { name: string }).name)
      .includes(collectionName);

    if (exists) {
      try {
        await chromaClient.deleteCollection({ name: collectionName });
        console.log("Deleted existing collection");
      } catch {
        console.log("Collection deletion failed, attempting to reset");

        const embeddingFunction: IEmbeddingFunction = {
          generate: async (texts: string[]) => {
            return await cohereEmbeddings.embedDocuments(texts);
          },
        };

        const collection = await chromaClient.getCollection({
          name: collectionName,
          embeddingFunction,
        });
        await collection.delete();
      }
    }

    // Wait a moment for deletion to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Create new collection
      await chromaClient.createCollection({ name: collectionName });
      console.log("Created new collection");
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        console.log(
          "Collection already exists, proceeding with existing collection"
        );
      } else {
        throw error;
      }
    }

    // Add documents to collection
    if (documents.length > 0) {
      console.log(`Adding ${documents.length} documents to collection`);
      await addDocumentsToVectorStore(documents);
    } else {
      console.log("No documents to add to collection");
    }

    console.log("Reindexing completed successfully");
  } catch (error) {
    console.error("Error reindexing documents:", error);
    throw new Error(
      `Reindexing failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
