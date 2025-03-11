"use client";

import React, { useState, useRef } from "react";
import { handleDocumentUpload, handleReindex } from "@/lib/actions";

interface UploadStatus {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
  metadata?: {
    fileName?: string;
    pageCount?: number;
    chunkCount?: number;
    documentCount?: number;
  };
}

interface FileInputEvent extends React.ChangeEvent<HTMLInputElement> {
  target: HTMLInputElement & {
    files: FileList;
  };
}

export default function AdminPanel(): React.ReactElement {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: "idle",
    message: "",
  });
  const [reindexStatus, setReindexStatus] = useState<UploadStatus>({
    status: "idle",
    message: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: FileInputEvent): Promise<void> => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadStatus({
      status: "uploading",
      message: `Uploading ${file.name}...`,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mimeType", file.type || "application/octet-stream");

      const response = await handleDocumentUpload(file);

      if (!response.success) {
        throw new Error(response.error || "Failed to upload document");
      }

      setUploadStatus({
        status: "success",
        message: `Successfully processed ${file.name}`,
        metadata: response.metadata,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      setUploadStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReindexClick = async (): Promise<void> => {
    setReindexStatus({
      status: "uploading",
      message: "Reindexing all documents...",
    });

    try {
      const response = await handleReindex();

      if (!response.success) {
        throw new Error(response.error || "Failed to reindex documents");
      }

      console.log("Reindex response:", { response });

      setReindexStatus({
        status: "success",
        message: "Successfully reindexed all documents",
        metadata: response.metadata,
      });
    } catch (error) {
      console.error("Error reindexing documents:", error);
      setReindexStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>

      {/* Document Upload Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload New Document</h2>
        <div className="mb-4">
          <label
            className="block mb-2 text-sm font-medium"
            htmlFor="file-upload"
          >
            Select PDF file:
          </label>
          <input
            id="file-upload"
            type="file"
            accept=".pdf,.txt,.html,.htm,.md,.json"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Upload Status */}
        {uploadStatus.status !== "idle" && (
          <div
            className={`mt-4 p-3 rounded-md ${
              uploadStatus.status === "uploading"
                ? "bg-blue-50 text-blue-700"
                : uploadStatus.status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">{uploadStatus.message}</p>
            {uploadStatus.status === "success" && uploadStatus.metadata && (
              <ul className="mt-2 text-sm">
                {uploadStatus.metadata.fileName && (
                  <li>File: {uploadStatus.metadata.fileName}</li>
                )}
                {uploadStatus.metadata.pageCount && (
                  <li>Pages: {uploadStatus.metadata.pageCount}</li>
                )}
                {uploadStatus.metadata.chunkCount && (
                  <li>Text chunks: {uploadStatus.metadata.chunkCount}</li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Reindex Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Reindex All Documents</h2>
        <p className="text-gray-600 mb-4">
          Use this function to rebuild the search index for all uploaded
          documents. This is useful if you&apos;ve deleted documents or if the
          index seems out of sync.
        </p>
        <button
          onClick={handleReindexClick}
          disabled={reindexStatus.status === "uploading"}
          className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-300"
        >
          {reindexStatus.status === "uploading"
            ? "Processing..."
            : "Reindex All Documents"}
        </button>

        {/* Reindex Status */}
        {reindexStatus.status !== "idle" && (
          <div
            className={`mt-4 p-3 rounded-md ${
              reindexStatus.status === "uploading"
                ? "bg-blue-50 text-blue-700"
                : reindexStatus.status === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            <p className="font-medium">{reindexStatus.message}</p>
            {reindexStatus.status === "success" && reindexStatus.metadata && (
              <div className="mt-2 text-sm">
                {reindexStatus.metadata.message ? (
                  <p>{reindexStatus.metadata.message}</p>
                ) : (
                  <ul>
                    <li>
                      Documents processed:{" "}
                      {reindexStatus.metadata.documentCount}
                    </li>
                    <li>
                      Total text chunks: {reindexStatus.metadata.chunkCount}
                    </li>
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
