# AI Usage Documentation

This document outlines the role of Artificial Intelligence in the AI Study Companion project, separating AI tools used to build the product from AI models integrated into the live application.

## AI Tools Used in Development

1. **AI Coding Assistant (Antigravity/Gemini):**
   - **Usage:** Used extensively for scaffolding the Next.js application, generating UI components with Tailwind CSS, writing Prisma schema definitions, and implementing server actions.
   - **Why:** To accelerate development and iterate quickly on complex features like the knowledge base vector integration and real-time chat UI.

2. **GitHub Copilot / Inline Suggestions:**
   - **Usage:** Autocomplete and boilerplate generation within the IDE.
   - **Why:** Reduces repetitive typing for standard React patterns and TypeScript definitions.

## AI Models Integrated in the Product

1. **Transformers.js (all-MiniLM-L6-v2) - Embedding Model**
   - **Where:** Runs locally in the Node.js backend during the document upload and parsing phase.
   - **Why:** Used to convert extracted text chunks from PDFs into high-dimensional vector embeddings. Running this locally avoids the cost and latency of calling an external embedding API, while keeping user document data private.

2. **Groq (Llama-3 70B/8B) - Generative LLM**
   - **Where:** Powers the AI Tutor chat interface and the dynamic Quiz generation engine.
   - **Why:** Groq provides exceptionally low-latency inference, which is critical for a smooth chat experience and real-time quiz generation. Llama-3 was chosen for its strong reasoning and instruction-following capabilities, making it ideal for answering student queries strictly based on the provided context (RAG).

## Architecture Integration (RAG)

The core value of the application relies on Retrieval-Augmented Generation (RAG). 
- When a user asks the AI Tutor a question, their query is embedded (via Transformers.js).
- The vector store (Prisma/SQLite) is searched for the most relevant concepts.
- These concepts are injected into the context window of the Groq Llama-3 model.
- The model is instructed to *only* answer using this context, preventing hallucinations and ensuring the tutor remains focused on the user's uploaded study materials.
