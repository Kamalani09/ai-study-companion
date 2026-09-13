"use client";

import { useActionState, useState, useEffect, use } from "react";
import { createProject, getProjects } from "@/lib/actions/project";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Project = {
  id: string;
  name: string;
  description: string | null;
  learningGoal: string | null;
  createdAt: Date;
};

export default function SpaceDashboardPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createState, createAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createProject(spaceId, formData);
      if (result.success) {
        loadProjects();
        return { success: true, timestamp: Date.now() };
      }
      return result;
    },
    { success: false } as any
  );

  async function loadProjects() {
    setLoading(true);
    try {
      const data = await getProjects(spaceId);
      setProjects(data);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes("Unauthorized") || e.message?.includes("not found")) {
        router.push("/dashboard");
      } else {
        setError("Failed to load projects. You may not have access to this space.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, [spaceId]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Access Denied</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            &larr; Back to Spaces
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Space Projects</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Project Form Card */}
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-5">Create New Project</h2>
            <form action={createAction} className="space-y-4" key={createState?.timestamp}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="name">
                  Project Name
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none dark:bg-slate-900/50 dark:text-white transition-all placeholder:text-slate-400"
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g., Python Basics"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none dark:bg-slate-900/50 dark:text-white transition-all placeholder:text-slate-400 resize-none"
                  id="description"
                  name="description"
                  placeholder="What is this project about?"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="learningGoal">
                  Learning Goal
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none dark:bg-slate-900/50 dark:text-white transition-all placeholder:text-slate-400 resize-none"
                  id="learningGoal"
                  name="learningGoal"
                  placeholder="What do you want to achieve?"
                  rows={2}
                />
              </div>
              
              {createState?.error && (
                <p className="text-sm text-red-500">{createState.error}</p>
              )}

              <button
                className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
                aria-disabled={isPending}
                disabled={isPending}
              >
                {isPending ? "Creating..." : "Create Project"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Projects List */}
        {loading ? (
          <div className="md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-slate-500 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 min-h-[250px]">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 min-h-[250px]">
            <p className="text-lg mb-1 font-medium text-slate-700 dark:text-slate-300">No projects in this space yet.</p>
            <p className="text-sm">Create one to start your focused learning journey!</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {project.name}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 text-sm leading-relaxed">
                {project.description || "No description."}
              </p>
              {project.learningGoal && (
                <div className="mt-5 p-3 bg-blue-50/80 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm flex-1 ring-1 ring-blue-100 dark:ring-blue-800/30">
                  <span className="font-semibold block mb-1">Goal:</span>
                  {project.learningGoal}
                </div>
              )}
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <span>{new Date(project.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
