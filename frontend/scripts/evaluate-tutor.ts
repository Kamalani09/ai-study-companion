import Groq from "groq-sdk";
import * as dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// The system prompt we use in the app
const SYSTEM_PROMPT = `You are a helpful and knowledgeable AI Study Companion.
Your primary role is to answer questions strictly based on the provided Context Materials.

Context Materials:
---
[Material 1: Biology 101] Mitochondria is the powerhouse of the cell. It generates ATP.
[Material 1: Biology 101] Photosynthesis occurs in chloroplasts.
---

Rules:
1. Answer questions using ONLY the information in the Context Materials.
2. If the user asks a question that is NOT covered by the context, you MUST politely refuse to answer and state that you don't have that information. Do not attempt to guess or use outside knowledge.
3. Be encouraging and helpful.`;

const TEST_CASES = [
  {
    name: "In-Context Query",
    prompt: "What is the powerhouse of the cell?",
    expectedBehavior: "Should answer correctly based on the context.",
  },
  {
    name: "Out-of-Context Query",
    prompt: "Who was the first president of the United States?",
    expectedBehavior: "Should refuse to answer because it's not in the context.",
  },
  {
    name: "Tricky/Adjacent Query",
    prompt: "What is ATP made of?",
    expectedBehavior: "Should refuse to answer because the exact composition of ATP is not in the context, even though ATP is mentioned.",
  }
];

const JUDGE_PROMPT = `You are an impartial AI evaluator. You are testing an AI Study Tutor's ability to stick to its system prompt.
Review the user's prompt, the expected behavior, and the AI Tutor's actual response.

Reply with exactly one line: either "PASS: <reason>" or "FAIL: <reason>".`;

async function runEvaluation() {
  console.log("Starting AI Tutor Evaluation...");
  console.log("==============================\n");

  let passes = 0;

  for (const test of TEST_CASES) {
    console.log(`[TEST]: ${test.name}`);
    console.log(`User Prompt: "${test.prompt}"`);

    // 1. Generate the Tutor's response
    const tutorChat = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: test.prompt }
      ],
      temperature: 0.1,
    });
    
    const tutorResponse = tutorChat.choices[0]?.message?.content || "";
    console.log(`Tutor Response: "${tutorResponse}"`);

    // 2. Ask the Judge LLM to evaluate the response
    const judgeEvaluation = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b", // Use a smarter model as the judge
      messages: [
        { role: 'system', content: JUDGE_PROMPT },
        { role: 'user', content: `Expected Behavior: ${test.expectedBehavior}\n\nActual Tutor Response: ${tutorResponse}` }
      ],
      temperature: 0,
    });

    const result = judgeEvaluation.choices[0]?.message?.content?.trim() || "FAIL: Empty response from judge";
    if (result.startsWith("PASS")) passes++;
    
    console.log(`Result: ${result}`);
    console.log("------------------------------\n");
  }

  console.log(`Evaluation Complete: ${passes}/${TEST_CASES.length} Passed.`);
}

runEvaluation().catch(console.error);
