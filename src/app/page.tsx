"use client";

import React, { useState, useRef, useEffect } from "react";
import { handleChatQuery } from "@/lib/actions";

interface Source {
  content: string;
  metadata: {
    source: string;
    page?: number;
    uploadedAt?: string;
    mimeType?: string;
  };
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await handleChatQuery(input);

      // Type assertion to ensure response.sources matches Source[]
      const formattedSources: Source[] =
        response.sources?.map((source) => ({
          content: source.content,
          metadata: {
            source: source.metadata.source || "unknown",
            page: source.metadata.page,
            uploadedAt: source.metadata.uploadedAt,
            mimeType: source.metadata.mimeType,
          },
        })) || [];

      // Add assistant response
      const assistantMessage: Message = {
        role: "assistant",
        content: response.answer,
        sources: formattedSources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setSources(formattedSources);
    } catch (error) {
      console.error("Error querying the chatbot:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      <h1 className="text-5xl font-bold text-center text-blue-700 my-10">
        Docuchat
      </h1>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 my-12">
            <h2 className="text-xl font-semibold mb-2">
              Document Q&A Assistant
            </h2>
            <p>Ask questions about your uploaded documents!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : "bg-gray-200 text-gray-800 rounded-bl-none"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {/* Sources section */}
        {sources.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              Sources:
            </h3>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="bg-gray-100 p-2 rounded-md text-sm">
                  <div className="font-semibold">
                    {source.metadata.source}{" "}
                    {source.metadata.page
                      ? `- Page ${source.metadata.page}`
                      : ""}
                  </div>
                  <div className="text-gray-600">{source.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask about your documents..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            {isLoading ? <span>...</span> : <span>Send</span>}
          </button>
        </div>
      </form>
    </div>
  );
}
