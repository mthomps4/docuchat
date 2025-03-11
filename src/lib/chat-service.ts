import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { queryVectorStore } from "./vector-store";

interface Source {
  content: string;
  metadata: {
    source: string;
    page?: number;
    uploadedAt?: string;
    mimeType?: string;
  };
}

interface ChatResponse {
  answer: string;
  sources?: Source[];
  error?: string;
}

export async function generateAnswer(query: string): Promise<ChatResponse> {
  try {
    if (!query?.trim()) {
      throw new Error("No query provided");
    }

    // Retrieve relevant documents
    const relevantDocs = await queryVectorStore(query);

    if (relevantDocs.length === 0) {
      return {
        answer:
          "I don't know about that. The information isn't in my documents.",
      };
    }

    // Combine document content
    const contextText = relevantDocs.map((doc) => doc.pageContent).join("\n\n");

    // Create LLM instance
    const llm = new ChatAnthropic({
      modelName: "claude-3-sonnet-20240229",
      temperature: 0,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create prompt template
    const promptTemplate =
      PromptTemplate.fromTemplate(`You are a helpful assistant that only provides information from the given documents.

Context information from documents:
{context}

User Question: {question}

If the information to answer the question isn't contained in the context, respond with "I don't have information about that in my documents."

Answer:`);

    // Create the chain using RunnableSequence
    const chain = RunnableSequence.from([
      {
        context: (input: { context: string; question: string }) =>
          input.context,
        question: (input: { context: string; question: string }) =>
          input.question,
      },
      promptTemplate,
      llm,
    ]);

    // Generate answer
    const response = await chain.invoke({
      context: contextText,
      question: query,
    });

    // Prepare sources for citation
    const sources = relevantDocs.map((doc) => ({
      content: doc.pageContent.substring(0, 150) + "...",
      metadata: {
        source: doc.metadata.source || "unknown",
        page: doc.metadata.page,
        uploadedAt: doc.metadata.uploadedAt,
        mimeType: doc.metadata.mimeType,
      },
    }));

    return {
      answer: response.content,
      sources,
    };
  } catch (error) {
    console.error("Error processing chat query:", error);
    throw new Error(
      error instanceof Error ? error.message : "Unknown error occurred"
    );
  }
}
