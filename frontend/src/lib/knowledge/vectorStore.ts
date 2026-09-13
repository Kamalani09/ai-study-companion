import fs from "fs";
import path from "path";

// A simple in-memory vector store backed by a local JSON file.
// Perfect for prototyping without external dependencies.
// Note: In production, you would swap this out for a real vector DB.

export type DocumentChunk = {
  id: string;
  projectId: string;
  materialId: string;
  text: string;
  embedding: number[];
};

export class LocalVectorStore {
  private filePath: string;
  private documents: DocumentChunk[] = [];

  constructor() {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, "vector_store.json");
    this.load();
  }

  private load() {
    if (fs.existsSync(this.filePath)) {
      const data = fs.readFileSync(this.filePath, "utf-8");
      this.documents = JSON.parse(data);
    }
  }

  private save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.documents, null, 2));
  }

  public async addDocuments(docs: DocumentChunk[]) {
    this.documents.push(...docs);
    this.save();
  }

  public async similaritySearch(
    projectId: string,
    queryEmbedding: number[],
    limit = 5
  ) {
    // Filter by project ID to ensure data isolation
    const projectDocs = this.documents.filter(
      (doc) => doc.projectId === projectId
    );

    // Calculate cosine similarity
    const scored = projectDocs.map((doc) => {
      const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
      return { ...doc, score };
    });

    // Sort by score descending and take top N
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  public async getChunksByProjectId(projectId: string) {
    return this.documents.filter((doc) => doc.projectId === projectId);
  }

  public async deleteDocumentsByMaterialId(materialId: string) {
    this.documents = this.documents.filter((doc) => doc.materialId !== materialId);
    this.save();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
