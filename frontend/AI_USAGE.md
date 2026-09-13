# AI Usage & Tooling

This document outlines how Artificial Intelligence is utilized within the AI Study Companion, both as a core feature of the product and as a tool during development.

## 1. Product AI Infrastructure

### Generating Text (LLM)
- **Provider:** Groq
- **Model:** `llama-3.1-70b-versatile` (Primary), `llama-3.1-8b-instant` (Fallback/Fast tasks).
- **Why Groq?** Groq provides exceptionally low-latency inference (often >800 tokens per second). For an application that relies heavily on dynamic quiz generation and conversational tutoring, latency is the biggest barrier to a good user experience. Groq ensures the app feels instantaneous.
- **Why Llama 3.1?** It is highly capable at following complex system prompts and generating strictly formatted JSON (which we rely on heavily for Quiz Generation and Concept Extraction).

### Embeddings & Vector Search
- **Library:** `Transformers.js`
- **Model:** `Xenova/all-MiniLM-L6-v2`
- **Why Local?** Instead of calling an external API (like OpenAI's text-embedding-ada-002), we run the embedding model entirely locally within the Node.js runtime. This removes API costs, eliminates network latency during document processing, and ensures privacy for user uploaded documents.

### Observability
All interactions with the Groq API are logged to the `AILog` database table. This tracks:
- Prompt and Completion Token usage
- Latency (in milliseconds)
- Success / Error rates
- Model used and Action performed

This data is exposed in the `/dashboard/admin` view.

## 2. Development AI Tooling

During the development of this prototype, AI coding assistants were heavily utilized.

### AI Agent Used
- **Agent:** Antigravity (Advanced Agentic Coding assistant).
- **Purpose:** Used as a pair-programmer to rapidly scaffold the Next.js application, implement Prisma schemas, design Tailwind CSS UIs, and write complex server-side logic (such as the custom in-memory Vector Store).

### Prompts Used During Development
*The following are examples of prompts used to guide the AI agent during development:*

- **Scaffolding:** "Initialize a Next.js 15 app with Prisma, SQLite, and shadcn/ui. Set up authentication using NextAuth.js."
- **Vector Store:** "Write a LocalVectorStore class in TypeScript that uses Transformers.js to generate embeddings and saves the vectors to a local JSON file. Implement a cosine similarity search function."
- **Background Processing:** "Wrap the `processMaterial` logic in a Next.js `after()` function so it runs in the background. Then build a React component that automatically polls the server every 3 seconds to check the processing status."
- **Structured Output:** "Write a prompt for Llama 3 that takes a document chunk and generates exactly 3 multiple choice questions in a strict JSON array format. Do not include markdown formatting in the response."
