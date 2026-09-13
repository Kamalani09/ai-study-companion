import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import ChatClient from "./chat-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ProjectChatPage(
  props: {
    params: Promise<{ projectId: string }>;
  }
) {
  const params = await props.params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const project = await prisma.project.findUnique({
    where: {
      id: params.projectId,
      userId: session.user.id,
    },
    include: {
      chatSessions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    }
  });

  if (!project) {
    redirect("/dashboard");
  }

  const initialSession = project.chatSessions[0] || null;

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-200">
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center space-x-4">
        <Link href={`/dashboard/projects/${params.projectId}`}>
          <Button variant="outline" size="sm">
            &larr; Back to Project
          </Button>
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">AI Tutor Chat</h2>
          <p className="text-sm text-slate-500">Ask questions about your uploaded materials</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <ChatClient 
          projectId={params.projectId} 
          initialSessionId={initialSession?.id || null}
          initialMessages={initialSession?.messages || []}
        />
      </div>
    </div>
  );
}
