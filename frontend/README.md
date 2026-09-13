# AI Study Companion

The AI Study Companion is an open-source, continuous learning platform designed to help students organize, understand, and master their study materials using contextual AI.

Unlike traditional chat interfaces, this platform focuses on a **connected learning loop**:
Upload Materials -> AI Extracts Concepts -> Chat with AI Tutor -> Take Adaptive Quizzes -> Track Mastery -> Get Recommendations -> Repeat.

## Key Features
- **Project-Based Organization:** Organize your study materials into Spaces (e.g., Semesters) and Projects (e.g., Classes).
- **Automated Processing:** Upload PDFs, and the system automatically extracts concepts and builds a vector-searchable knowledge base in the background.
- **Strictly Grounded AI Tutor:** The tutor only answers questions based on your uploaded materials and cites its sources. It will politely refuse off-topic questions.
- **Adaptive Quizzes:** Generate multiple-choice and open-ended quizzes. The AI grades your answers and updates your concept mastery.
- **Concept Mastery Tracking:** Visually track your progress on specific concepts extracted from your materials.
- **Admin Observability:** Global dashboard tracking AI token usage, latency, success rates, and user activity.

## Tech Stack
- **Framework:** Next.js 15 (App Router, Server Actions)
- **Styling:** Tailwind CSS, shadcn/ui
- **Database:** Prisma with SQLite (for easy local setup)
- **AI Models:** Groq (Llama-3.1-70b/8b) for fast generation, Transformers.js (all-MiniLM-L6-v2) for local embeddings.
- **Authentication:** NextAuth.js (Credentials/GitHub)

## Quick Start Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/your-username/ai-study-companion.git
cd ai-study-companion/frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the `frontend` directory:
```env
# Database
DATABASE_URL="file:./dev.db"

# Authentication (Required for NextAuth)
NEXTAUTH_SECRET="generate-a-secure-random-string-here"
NEXTAUTH_URL="http://localhost:3000"

# Groq API for AI Generation
GROQ_API_KEY="your-groq-api-key"
```

### 4. Setup the Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Demo Access
*Note: These are demo credentials for evaluating the application and should not be used in production.*
- **Demo User:** `demo@example.com` / `password123`
- **Demo Admin:** `admin@example.com` / `admin123`

## Documentation
- Read `docs/ARCHITECTURE.md` for a deep dive into the system design, data isolation, and trade-offs.
- Read `docs/AI_USAGE.md` for information on how AI models were selected and used in this project.
- Read `LIMITATIONS.md` for known constraints and future improvements.
