import { auth } from "@/auth";
import { deleteMaterial } from "@/lib/actions/material";
import { GenerateQuizButton } from "./generate-quiz-button";
import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UploadMaterialForm } from "./upload-form";
import { FileText, Loader2, CheckCircle2, AlertCircle, MessageSquare, Activity, Brain, BookOpen } from "lucide-react";
import Link from "next/link";
import { MaterialsList } from "./materials-list";

export default async function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { projectId } = await params;

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    include: {
      materials: {
        orderBy: {
          createdAt: 'desc'
        }
      },
      quizzes: {
        include: {
          questions: true
        }
      },
      conceptMasteries: true,
    }
  });

  if (!project) {
    notFound();
  }

  // Extract all valid concepts from active quizzes
  const activeConcepts = new Set(
    project.quizzes.flatMap(q => q.questions.map(qq => qq.concept))
  );

  // Filter concept masteries to only show those that belong to active quizzes
  const validConceptMasteries = project.conceptMasteries.filter(cm => activeConcepts.has(cm.concept));

  const hasCompletedMaterials = project.materials.some(m => m.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{project.name}</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">{project.description}</p>
          {project.learningGoal && (
            <div className="mt-2 text-sm">
              <strong>Learning Goal:</strong> {project.learningGoal}
            </div>
          )}
        </div>
        
        <Link href={`/dashboard/projects/${project.id}/chat`}>
          <Button disabled={!hasCompletedMaterials} size="lg" className="gap-2 rounded-xl shadow-sm hover:shadow transition-all bg-blue-600 hover:bg-blue-700 text-white">
            <MessageSquare className="w-5 h-5" />
            AI Tutor Chat
          </Button>
        </Link>
      </div>

      {/* Recommendations Section */}
      <Card className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 border-blue-100/60 dark:border-blue-800/30 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Next Learning Action
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            if (validConceptMasteries.length > 0) {
              const weakConcepts = validConceptMasteries.filter(cm => cm.masteryLevel < 70).sort((a, b) => a.masteryLevel - b.masteryLevel);
              if (weakConcepts.length > 0) {
                return (
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Focus on these concepts:</p>
                      <ul className="list-disc list-inside mt-1.5 mb-2 space-y-1">
                        {weakConcepts.map(c => (
                          <li key={c.id} className="text-sm text-slate-700">
                            <strong>{c.concept}</strong> ({c.masteryLevel}% mastery)
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm text-slate-600">We recommend <Link href={`/dashboard/projects/${project.id}/chat`} className="text-blue-600 hover:underline font-medium">chatting with the AI Tutor</Link> to clarify these concepts before taking another quiz.</p>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-900">Great Job!</p>
                      <p className="text-sm text-slate-600 mt-1">You are showing strong mastery across all tested concepts. Generate a new quiz to reinforce your knowledge, or upload more advanced materials.</p>
                    </div>
                  </div>
                );
              }
            } else if (project.materials.length > 0 && hasCompletedMaterials) {
              return (
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Establish your baseline</p>
                    <p className="text-sm text-slate-600 mt-1">Your materials are ready. <Link href={`/dashboard/projects/${project.id}/chat`} className="text-blue-600 hover:underline">Chat with the tutor</Link> or generate your first quiz to identify what you need to focus on.</p>
                  </div>
                </div>
              );
            } else {
              return (
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-slate-900">Start your learning journey</p>
                    <p className="text-sm text-slate-600 mt-1">Upload a PDF document below so the AI Study Companion can process it into your knowledge base.</p>
                  </div>
                </div>
              );
            }
          })()}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">Study Materials</h2>
          
          <MaterialsList projectId={project.id} initialMaterials={project.materials} />
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Adaptive Quizzes</CardTitle>
              <CardDescription>
                Test your knowledge based on your uploaded materials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GenerateQuizButton projectId={project.id} disabled={!hasCompletedMaterials} />
              <div className="space-y-2 mt-4">
                {project.quizzes && project.quizzes.length > 0 ? (
                  project.quizzes.map((quiz) => (
                    <div key={quiz.id} className="flex justify-between items-center p-4 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 rounded-xl transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80">
                      <span className="font-medium text-slate-900 dark:text-slate-100">{quiz.title}</span>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/projects/${project.id}/quiz/${quiz.id}`}>
                          <Button variant="outline" size="sm">Take Quiz</Button>
                        </Link>
                        <form action={async () => {
                          "use server";
                          const { deleteQuiz } = await import("@/lib/actions/quiz");
                          await deleteQuiz(quiz.id, project.id);
                        }}>
                          <Button type="submit" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">No quizzes generated yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Concept Mastery</CardTitle>
              <CardDescription>Your progress across extracted concepts.</CardDescription>
            </CardHeader>
            <CardContent>
              {validConceptMasteries.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                  {validConceptMasteries.map((cm) => (
                    <div key={cm.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cm.concept}</span>
                        <span>{cm.masteryLevel}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${cm.masteryLevel >= 80 ? 'bg-green-500' : cm.masteryLevel >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${cm.masteryLevel}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Take a quiz to start tracking concept mastery.</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-sm border-slate-200/60 dark:border-slate-700/60 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Upload Material</CardTitle>
              <CardDescription>
                Upload a PDF document to process it into your knowledge base.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadMaterialForm projectId={project.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
