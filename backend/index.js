import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import { OpenAI } from "openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { QdrantClient } from "@qdrant/js-client-rest";

const app = express();
const corsOptions = process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : {};
app.use(cors(corsOptions));
app.use(express.json());

// Multer
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const upload = multer({ dest: uploadDir });

const openaiClient = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: "text-embedding-3-small",
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});

const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333";
const qdrantApiKey = process.env.QDRANT_API_KEY;
const qdrantClient = new QdrantClient({ 
  url: qdrantUrl,
  ...(qdrantApiKey && { apiKey: qdrantApiKey })
});

const queryModel = 'openai/gpt-oss-20b:free';

const collectionStatuses = new Map();

async function indexing(filePath, originalName, collectionId) {
  try {
    // Create collection
    await qdrantClient.createCollection(collectionId, {
      vectors: {
        size: 1536, // text-embedding-3-small dimension
        distance: "Cosine",
      },
    });
    console.log(`Created Qdrant collection: ${collectionId}`);

    // Vector Store
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      embeddings,
      {
        url: qdrantUrl,
        ...(qdrantApiKey && { apiKey: qdrantApiKey }),
        collectionName: collectionId,
      }
    );

    // Load & Split
    let docs;
    const lowerName = originalName.toLowerCase();
    if (lowerName.endsWith(".csv")) {
      console.log(`[${collectionId}] Loading CSV file: ${originalName}`);
      const loader = new CSVLoader(filePath);
      docs = await loader.load();
    }
    else if (lowerName.endsWith(".txt")) {
      console.log(`[${collectionId}] Loading TXT file: ${originalName}`);
      const loader = new TextLoader(filePath);
      docs = await loader.load();
    }
    else if (lowerName.endsWith(".pdf")) {
      console.log(`[${collectionId}] Loading PDF file: ${originalName}`);
      const loader = new PDFLoader(filePath);
      docs = await loader.load();
    }
    else {
      throw new Error(`Unsupported file type: ${originalName}`);
    }

    console.log(`[${collectionId}] Loaded ${docs.length} documents`);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await textSplitter.splitDocuments(docs);

    const BATCH_SIZE = 50;

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      await vectorStore.addDocuments(batch);
      console.log(`[${collectionId}] Indexed batch ${i}`);
    }

    console.log(`[${collectionId}] Indexing Completed`);
    collectionStatuses.set(collectionId, "ready");
  } catch (err) {
    console.error(`[${collectionId}] Error during indexing:`, err);
    collectionStatuses.set(collectionId, "error");
  }
}

async function retrieval(query, collectionId) {
  const vectorStore = await QdrantVectorStore.fromExistingCollection(
    embeddings,
    {
      url: qdrantUrl,
      ...(qdrantApiKey && { apiKey: qdrantApiKey }),
      collectionName: collectionId,
    }
  );

  const searchedChunks = await vectorStore.similaritySearch(query, 3);
  console.log(`[${collectionId}] Found ${searchedChunks.length} relevant chunks`);

  const context = searchedChunks
    .map((doc, i) => {
      console.log(`[${collectionId}] Chunk ${i+1} preview: ${doc.pageContent.substring(0, 100)}...`);
      return `Chunk ${i + 1}:\n${doc.pageContent}`;
    }).join("\n\n");

  const system_prompt = `
        You are an AI Assistant who helps resolving the user query based on the avaliable context provided to you from file with the content.
        Rules :
        - Only answer based on the avaliable context from the file only.
        - If the answer is not present in the context, respond exactly with: "I don't know. This has not been provided in the file uploaded by you."
        - Give the references after the answer if available.
        Context : ${context}
    `;

  const response = await openaiClient.chat.completions.create({
    model: queryModel,
    messages: [
      {
        role: "system",
        content: system_prompt,
      },
      {
        role: "user",
        content: query,
      },
    ],
  });
  return response.choices[0].message.content;
}

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const collectionId = `doc-${Date.now()}`;
  collectionStatuses.set(collectionId, "processing");

  // indexing
  indexing(req.file.path, req.file.originalname, collectionId);

  res.json({ collectionId, status: "processing" });
});

app.get("/status/:id", (req, res) => {
  const status = collectionStatuses.get(req.params.id);
  if (!status) {
    return res.status(404).json({ error: "Collection not found" });
  }
  res.json({ status });
});

app.post("/query", async (req, res) => {
  try {
    const { query, collection } = req.body;

    if (!query || !collection) {
      return res.status(400).json({ error: "Query and collection are required" });
    }

    const answer = await retrieval(query, collection);
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));