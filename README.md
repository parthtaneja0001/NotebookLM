# NotebookLM Clone — RAG-Powered Document Chat

**Live Demo**: [https://notebook-lm-six.vercel.app/](https://notebook-lm-six.vercel.app/)

A full-stack **Retrieval-Augmented Generation (RAG)** application that allows users to upload documents (PDF, TXT, CSV) and have intelligent conversations grounded in the document's actual content.

## What It Does

1. **Upload** a document via the web interface
2. The system **processes** it in the background — chunking, embedding, and indexing into a vector database
3. Ask **natural language questions** about the document
4. The system **retrieves** the most relevant chunks and generates a **grounded answer** using an LLM
5. Answers come **only from the document** — not from the LLM's general knowledge

## Architecture & RAG Pipeline

The application implements a complete end-to-end RAG pipeline:

| Stage | Implementation |
|-------|---------------|
| **Ingestion** | PDF, TXT, CSV files uploaded via Express + Multer |
| **Chunking** | `RecursiveCharacterTextSplitter` (chunkSize: 500, chunkOverlap: 50) |
| **Embedding** | OpenAI `text-embedding-3-small` via OpenRouter API |
| **Storage** | Qdrant Vector Database (Docker) with 1536-dimensional vectors |
| **Retrieval** | Cosine similarity search, top-3 chunks retrieved |
| **Generation** | `openai/gpt-oss-20b:free` via OpenRouter with strict system prompt |

### Chunking Strategy

We use **LangChain's `RecursiveCharacterTextSplitter`** with the following configuration:
- `chunkSize`: 500 characters
- `chunkOverlap`: 50 characters

This strategy recursively splits text on natural boundaries (paragraphs, sentences, words) to preserve semantic meaning while keeping chunks small enough for precise retrieval. The 50-character overlap ensures no context is lost at chunk boundaries.

### Retrieval Strategy

- **Similarity Metric**: Cosine distance in Qdrant
- **Top-K**: 3 most relevant chunks retrieved per query
- **Context Injection**: Retrieved chunks are injected into the LLM's system prompt with strict instructions to answer only from the provided context

### Generation Strategy

The LLM receives a system prompt that:
- Restricts answers to the retrieved context only
- Returns "I don't know" if the answer is not in the context
- Includes reference to the source chunks

## Tech Stack

- **Frontend**: React 19, Vite 5, TailwindCSS v4, Lucide React, Framer Motion
- **Backend**: Express.js, Multer, LangChain
- **Vector Database**: Qdrant (Docker)
- **LLM/Embeddings**: OpenRouter API (`text-embedding-3-small`, `openai/gpt-oss-20b:free`)

## Project Structure

```
NotebookLM/
├── backend/
│   ├── index.js              # Express server with RAG pipeline
│   ├── docker-compose.yml    # Qdrant vector database
│   ├── package.json
│   └── .env                  # API keys (not committed)
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Main app component
│   │   ├── components/
│   │   │   ├── FileUpload.tsx
│   │   │   ├── ChatArea.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ChatBubble.tsx
│   │   └── lib/utils.ts
│   ├── vite.config.ts
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+
- Docker Desktop
- OpenRouter API key ([get one free](https://openrouter.ai/))

### 1. Clone & Install Dependencies

```bash
git clone <your-repo-url>
cd NotebookLM

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
PORT=3000
```

### 3. Start Qdrant Vector Database

```bash
cd backend
docker compose up -d
```

This starts Qdrant on `http://localhost:6333`.

### 4. Start the Backend Server

```bash
cd backend
node index.js
```

The backend will run on `http://localhost:3000`.

### 5. Start the Frontend Dev Server

In a new terminal:

```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:5173`.

### 6. Open in Browser

Navigate to `http://localhost:5173` and start uploading documents!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload a file (PDF/TXT/CSV) |
| `/status/:id` | GET | Check indexing status of a document |
| `/query` | POST | Ask a question about an uploaded document |

### Example API Usage

**Upload a file:**
```bash
curl -X POST -F "file=@document.pdf" http://localhost:3000/upload
```

**Query the document:**
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What is this document about?", "collection": "doc-1234567890"}'
```

## How It Works (Step by Step)

1. **File Upload**: User uploads a file via the React frontend
2. **Background Processing**: Backend receives the file, creates a unique collection in Qdrant
3. **Document Loading**: LangChain loaders parse PDF/TXT/CSV into raw documents
4. **Chunking**: `RecursiveCharacterTextSplitter` breaks documents into 500-char chunks with 50-char overlap
5. **Embedding**: Each chunk is converted to a 1536-dim vector using `text-embedding-3-small`
6. **Indexing**: Vectors are stored in Qdrant with Cosine distance metric
7. **Querying**: User asks a question → question is embedded → Qdrant finds top-3 similar chunks
8. **Generation**: Retrieved chunks + question are sent to `openai/gpt-oss-20b:free` with a strict system prompt
9. **Answer**: LLM generates a response grounded only in the retrieved context

## Submission Checklist

- [x] **GitHub Repository** — Public repo with complete code
- [x] **Live Project** — [https://notebook-lm-six.vercel.app/](https://notebook-lm-six.vercel.app/)
- [x] **RAG Pipeline** — End-to-end: ingestion → chunking → embedding → storage → retrieval → generation
- [x] **Chunking Strategy** — `RecursiveCharacterTextSplitter` (500 chars, 50 overlap)
- [x] **Vector Database** — Qdrant for embedding storage and similarity search
- [x] **Grounded Answers** — LLM restricted to retrieved context only
- [x] **Code Quality & Documentation** — This README + inline comments

## License

MIT
