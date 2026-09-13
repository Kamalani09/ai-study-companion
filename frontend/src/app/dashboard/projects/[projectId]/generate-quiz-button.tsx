"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function GenerateQuizButton({ projectId, disabled }: { projectId: string, disabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to generate quiz");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating quiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      className="w-full" 
      disabled={disabled || loading} 
      onClick={handleGenerate}
    >
      {loading ? "Generating Quiz... (Please wait)" : "Generate New Quiz"}
    </Button>
  );
}
