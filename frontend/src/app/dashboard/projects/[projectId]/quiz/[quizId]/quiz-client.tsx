"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

type Question = {
  id: string;
  type?: string;
  question: string;
  options: string[];
};

export function QuizClient({ quizId, projectId, questions, title }: { quizId: string, projectId: string, questions: Question[], title: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const handleOptionChange = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length || Object.values(answers).some(val => val.trim() === "")) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || "Failed to submit quiz");
      }
    } catch (e) {
      console.error(e);
      alert("Error submitting quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <Card className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Quiz Results: {title}</h2>
            <p className="text-blue-100 text-lg">
              You scored <span className="font-bold text-white">{result.score}</span> out of {result.total}.
            </p>
          </div>
          <CardContent className="space-y-6 pt-8">
            {result.results.map((res: any, idx: number) => (
              <div key={res.questionId} className={`p-5 border rounded-2xl ${res.isCorrect ? 'border-green-200 bg-green-50/50 dark:border-green-900/30 dark:bg-green-900/10' : 'border-red-200 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10'}`}>
                <p className="font-semibold mb-3 text-slate-900 dark:text-slate-100">
                  <span className="opacity-70 mr-1">Q{idx + 1}:</span> {questions.find(q => q.id === res.questionId)?.question}
                </p>
                <div className="space-y-2 mb-4">
                  <p className="text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Your Answer:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-md ${res.isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>{res.userAnswer}</span>
                  </p>
                  {!res.isCorrect && res.type !== "OPEN_ENDED" && (
                    <p className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Correct Answer:</span>
                      <span className="ml-2 px-2 py-1 rounded-md bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{res.correctAnswer}</span>
                    </p>
                  )}
                  {res.type === "OPEN_ENDED" && (
                    <p className="text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Ideal Answer:</span>
                      <span className="ml-2 px-2 py-1 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 block mt-1 leading-relaxed">{res.correctAnswer}</span>
                    </p>
                  )}
                </div>
                <div className="mt-4 text-sm text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <strong className="block mb-1 text-slate-900 dark:text-slate-100">Feedback:</strong>
                  <span className="leading-relaxed">{res.explanation}</span>
                </div>
              </div>
            ))}
          </CardContent>
          <CardFooter className="pb-8 pt-4 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
            <Button size="lg" className="rounded-xl shadow-sm hover:shadow" onClick={() => router.push(`/dashboard/projects/${projectId}`)}>Back to Project</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div className="mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Answer the questions below to test your knowledge.</p>
      </div>

      {questions.map((q, idx) => (
        <Card key={q.id} className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm transition-all hover:shadow-md">
          <CardHeader className="pb-4">
            <Badge variant="secondary" className="w-fit mb-2 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-50">Question {idx + 1}</Badge>
            <CardTitle className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-slate-100">{q.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {q.type === "OPEN_ENDED" ? (
              <textarea
                className="w-full min-h-[140px] p-4 text-base bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all placeholder:text-slate-400 resize-y"
                placeholder="Type your answer here in detail..."
                value={answers[q.id] || ""}
                onChange={(e) => handleOptionChange(q.id, e.target.value)}
              />
            ) : (
              <RadioGroup onValueChange={(val) => handleOptionChange(q.id, val)} value={answers[q.id] || ""}>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <label 
                        key={oIdx} 
                        htmlFor={`${q.id}-${oIdx}`}
                        className={`flex items-start space-x-3 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/50 dark:border-blue-500/50 dark:bg-blue-900/20 ring-1 ring-blue-500/20' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <RadioGroupItem value={opt} id={`${q.id}-${oIdx}`} className="mt-0.5 border-slate-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-base text-slate-700 dark:text-slate-200 leading-relaxed font-medium select-none">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
        <Button size="lg" className="rounded-xl shadow-sm hover:shadow transition-all bg-blue-600 hover:bg-blue-700 text-white px-8" onClick={handleSubmit} disabled={submitting}>
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Submitting...
            </>
          ) : "Submit Quiz"}
        </Button>
      </div>
    </div>
  );
}
