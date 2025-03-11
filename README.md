# DocuChat

A powerful document chat application that allows users to upload PDFs and have interactive conversations about their content using advanced AI technology.

## Overview

DocuChat is a RAG (Retrieval Augmented Generation) application that combines document processing, vector storage, and AI language models to enable intelligent document-based conversations. Users can upload PDF documents and ask questions about their content, receiving accurate responses based on the document's information.

## Architecture

The application uses a modern tech stack with several key components:

### AI and Language Models

- **Anthropic Claude (via @langchain/anthropic)**
  - Primary Large Language Model (LLM) for generating responses
  - Handles natural language understanding and generation
  - Provides contextual, accurate answers based on retrieved document segments
  - Requires API key configuration in .env file

- **Cohere (via @langchain/cohere)**
  - Handles document and query embedding generation
  - Converts text into high-dimensional vectors
  - Free to use for embeddings
  - Optimized for semantic search and similarity matching

### Vector Database

- **Chroma (via chromadb)**
  - Vector database for storing document embeddings
  - Runs as a separate Docker container
  - Enables efficient similarity search
  - Maintains relationships between document chunks and their vectors
  - Persists data between application restarts
  - Accessible via HTTP API (default: <http://localhost:8000>)

### Document Processing

- **pdf-parse**
  - Extracts text content from PDF files
  - Maintains formatting and structure
  - Enables processing of multi-page documents

### Framework and Integration

- **LangChain (via langchain)**
  - Core framework orchestrating all components
  - Provides document loaders and text splitters
  - Manages chains and prompts
  - Handles integration between components
  - Includes:
    - Document loading and parsing
    - Text chunking and processing
    - Vector store operations
    - LLM chain management
    - Response generation

- **@langchain/community**
  - Provides additional integrations and tools
  - Includes Chroma vector store integration
  - Contains various document loaders and text splitters

## Features

- **Document Upload**
  - Support for PDF documents
  - Automatic text extraction
  - Intelligent chunking for optimal processing
  - Progress tracking and status updates

- **Vector Storage**
  - Automatic document vectorization
  - Efficient similarity search
  - Persistent storage of embeddings
  - Reindexing capabilities

- **Interactive Chat**
  - Natural language question answering
  - Context-aware responses
  - Real-time processing
  - Accurate information retrieval

## Technical Workflow

1. **Document Processing**
   - PDF upload to public/documents/
   - Text extraction using pdf-parse
   - Content splitting into manageable chunks
   - Metadata extraction and storage

2. **Vector Processing**
   - Chunk vectorization using Cohere
   - Vector storage in Chroma database
   - Metadata association with vectors
   - Index management

3. **Query Processing**
   - Question vectorization
   - Similarity search in vector database
   - Context retrieval
   - Answer generation using Claude

4. **Maintenance Operations**
   - Reindexing capability for database updates
   - Document management
   - Vector store optimization

## Setup and Configuration

1. **Environment Setup**
   Copy .env.example to .env and configure:

   ```sh
   COHERE_API_KEY=your_api_key
   ANTHROPIC_API_KEY=your_anthropic_key_here
   CHROMA_URL=http://localhost:8000
   ```

2. **Vector Database**
   Start the Chroma vector database:

   ```sh
   docker run -p 8000:8000 chromadb/chroma
   ```

3. **Application**
   Start the development server:

   ```sh
   npm run dev
   ```

## Usage

1. **Document Upload**
   - Use the upload interface to select PDF files
   - Wait for processing completion
   - View document statistics (pages, chunks)

2. **Document Chat**
   - Enter questions about uploaded documents
   - Receive AI-generated responses
   - View source context for answers

3. **Maintenance**
   - Use reindex function if needed
   - Monitor document processing status
   - Manage uploaded documents

## Technical Requirements

- Node.js
- Docker (for Chroma vector database)
- Anthropic API key
- Cohere API key
- Modern web browser
- Internet connection (for API access)

## Data Management and Cleanup

### Document Storage
- PDF files are stored in `public/documents/` directory
- Each file maintains its original name and format
- Files can be manually deleted from this directory when no longer needed

### Vector Database
- Document embeddings are stored in Chroma vector database
- Data persists between application restarts
- To clear the vector database:
  1. Stop the Chroma container
  2. Remove the container: `docker rm chromadb`
  3. Restart with a fresh instance: `docker run -p 8000:8000 chromadb/chroma`

### Complete Cleanup
To completely reset the application:
1. Delete all files in `public/documents/` directory
2. Reset the vector database (steps above)
3. Restart the application

### Maintenance Tips
- Regularly backup important documents
- Use the reindex function after manual file deletions
- Monitor disk space usage in `public/documents/`
- Check Chroma database health periodically
