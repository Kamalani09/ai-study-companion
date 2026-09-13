# System Architecture

The AI Study Companion follows a modern, modular Next.js architecture leveraging Server Actions, Prisma ORM, and LLMs for dynamic learning experiences.

## Core Architectural Concepts

### 1. Project-Level Data Isolation
To ensure the AI Tutor never "hallucinates" or mixes contexts between different classes or subjects, all data is strictly isolated at the **Project** level.
- When a user uploads a PDF, it is attached to a specific `ProjectId`.
- When the background processor chunks the PDF and stores it in the local Vector Store, the `ProjectId` is embedded as metadata.
- When the AI Tutor retrieves context, the vector similarity search is **hard-filtered** by `ProjectId`.
- This guarantees that a chat session in a "Biology" project cannot access chunks from a "History" project, maintaining a pure, grounded context.

### 2. Connected Learning Loop
Rather than isolated features, the system flows in a loop:
1. **Extraction:** AI extracts key "Concepts" from uploaded PDFs.
2. **Quizzing:** Quizzes are generated to target those extracted concepts.
3. **Mastery Tracking:** When a user completes a quiz, the system grades it (using Groq for open-ended questions) and updates a `ConceptMastery` record.
4. **Recommendation:** The dashboard analyzes low-mastery concepts and recommends focused chat sessions to improve understanding.

### 3. Background Processing in Serverless
Parsing large PDFs, chunking text, generating embeddings, and extracting concepts via LLM takes time. Doing this synchronously blocks the user interface and risks serverless timeouts.
- **Trade-off Decision:** Instead of setting up a complex external message queue (like RabbitMQ or Redis/Celery) which complicates deployment, we utilized Next.js 15's experimental `after()` function.
- `after()` allows us to safely dispatch the `processMaterial` function in the background after returning an immediate `200 OK` (with a `PENDING` status) to the client.
- The client then automatically polls the server every 3 seconds until the status changes to `COMPLETED`.

### 4. Local Vector Store vs Managed Database
- **Trade-off Decision:** For the vector database, we opted to build a custom `LocalVectorStore` (backed by a JSON file) rather than requiring a managed service like Pinecone or pgvector.
- **Why?** To keep the prototype extremely easy to deploy and run locally without requiring third-party vector database API keys.
- **How it works:** We use `Transformers.js` to run the `Xenova/all-MiniLM-L6-v2` embedding model directly in the Node.js process. The embeddings and chunks are saved to `.vector_store.json`. Cosine similarity is calculated in-memory during retrieval.

### 5. Safe Application Interaction (Structured Outputs)
The AI is not given free rein to mutate the database. Instead, we use strictly enforced JSON schemas (Zod).
- When generating a Quiz, the LLM is forced to output a JSON array of `QuizQuestion` objects matching our schema.
- The server validates this JSON before saving it to the SQLite database.
- This ensures the UI never breaks due to malformed AI output.

## Data Model (Prisma)
- **User:** The top-level account.
- **Space:** A folder-like grouping (e.g., "Fall 2024").
- **Project:** A specific study area (e.g., "Intro to Biology"). Contains Materials, Quizzes, Chat Sessions, and Concept Masteries.
- **Material:** An uploaded PDF.
- **ChatSession / Message:** History of interactions with the AI Tutor.
- **Quiz / QuizQuestion / QuizAttempt:** Structured assessments.
- **ConceptMastery:** A tracked score (0-100) for a specific concept within a Project.
- **AILog / Activity:** Observability and activity tracking tables.
