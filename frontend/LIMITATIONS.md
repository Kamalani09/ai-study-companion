# Limitations & Future Improvements

While the AI Study Companion is fully functional as a prototype, several engineering trade-offs were made to optimize for development speed, ease of local deployment, and zero-configuration setups.

## Current Limitations

### 1. In-Memory Vector Store
We built a custom `LocalVectorStore` that stores embeddings in a `.vector_store.json` file.
- **Limitation:** This is not horizontally scalable. If the app were deployed to multiple serverless functions (like Vercel), they would not share the same JSON file. Furthermore, calculating cosine similarity in memory (O(N) complexity) works perfectly for a few hundred PDFs, but will become a bottleneck for millions of documents.
- **Mitigation:** In a production environment, this should be replaced with a managed vector database (e.g., Pinecone, Weaviate, or PostgreSQL with `pgvector`).

### 2. Local File Uploads
PDFs are currently saved to the `public/uploads` directory.
- **Limitation:** Serverless platforms like Vercel have ephemeral file systems. Any PDF uploaded during runtime will be lost when the function spins down.
- **Mitigation:** Integrate an S3-compatible object storage service (like AWS S3 or Uploadthing) to store the raw PDF files permanently.

### 3. Background Processing (Next.js `after`)
We use `after()` to process documents without blocking the UI.
- **Limitation:** Vercel limits the execution time of serverless functions (e.g., 10-60 seconds depending on the tier). If a user uploads a massive textbook, the processing might exceed this timeout and be killed ungracefully.
- **Mitigation:** Use a robust background job queue like Inngest, Trigger.dev, or a dedicated worker server to process heavy workloads reliably.

### 4. Basic AI Evaluation
Our AI evaluation currently relies on an offline script that uses LLM-as-a-judge.
- **Limitation:** True AI evaluation requires continuous, automated testing against a large dataset of ground-truth Q&A pairs (Golden Dataset).
- **Mitigation:** Implement a rigorous evaluation pipeline using tools like LangSmith or Phoenix to trace executions and monitor retrieval metrics (e.g., Precision@K, NDCG).

## Future Improvements
If given more time, the next features to build would be:
1. **Multi-Modal Support:** Allow uploading YouTube videos or audio lectures, transcribe them using Whisper, and add them to the knowledge base.
2. **Spaced Repetition:** Convert weak concepts into flashcards and implement a Leitner system algorithm to prompt the user to review them at optimal intervals.
3. **Multi-User Collaboration:** Allow students to invite classmates to a "Space" to share uploaded materials and compete on quizzes.
