"use client";

import { createSpace, getSpaces } from "@/lib/actions/space";
import { getRecentActivity } from "@/lib/actions/activity";
import Link from "next/link";
import { useEffect, useActionState, useState } from "react";
import { Activity as ActivityIcon } from "lucide-react";

// For typing the response from getSpaces
type Space = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  _count: { projects: number };
};

type Activity = {
  id: string;
  type: string;
  details: string | null;
  createdAt: Date;
};

export default function DashboardPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const [createState, createAction, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      const result = await createSpace(formData);
      if (result.success) {
        // Refresh spaces and activity after successful creation
        loadData();
        // Return clear state for form reset
        return { success: true, timestamp: Date.now() };
      }
      return result;
    },
    { success: false } as any
  );

  async function loadData() {
    setLoading(true);
    try {
      const [spaceData, activityData] = await Promise.all([
        getSpaces(),
        getRecentActivity(5)
      ]);
      setSpaces(spaceData);
      setActivities(activityData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Your Spaces</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create Space Form Card */}
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-5 tracking-tight">Create New Space</h2>
            <form action={createAction} className="space-y-4" key={createState?.timestamp}>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="name">
                  Name
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none dark:bg-slate-900/50 dark:text-white transition-all placeholder:text-slate-400"
                  id="name"
                  type="text"
                  name="name"
                  placeholder="e.g., Computer Science"
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
                  placeholder="What is this space about?"
                  rows={3}
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
                {isPending ? "Creating..." : "Create Space"}
              </button>
            </form>
          </div>
        </div>

        {/* Existing Spaces List */}
        {loading ? (
          <div className="md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center text-slate-500 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 min-h-[250px]">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p>Loading spaces...</p>
          </div>
        ) : spaces.length === 0 ? (
          <div className="md:col-span-1 lg:col-span-2 flex flex-col items-center justify-center p-12 bg-slate-100/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 min-h-[250px]">
            <p className="text-lg mb-1 font-medium text-slate-700 dark:text-slate-300">No spaces found</p>
            <p className="text-sm">Create one to get started!</p>
          </div>
        ) : (
          spaces.map((space) => (
            <Link
              key={space.id}
              href={`/dashboard/spaces/${space.id}`}
              className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group flex flex-col"
            >
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {space.name}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 flex-1 text-sm leading-relaxed">
                {space.description || "No description provided."}
              </p>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-sm font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  {space._count.projects} Project{space._count.projects !== 1 ? 's' : ''}
                </span>
                <span>{new Date(space.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white mb-5">Recent Activity</h2>
        <div className="bg-white dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 p-6 transition-all duration-300">
          {loading ? (
            <div className="flex items-center justify-center p-6">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-5">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-5 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-xl shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 mt-0.5">
                    <ActivityIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-slate-100 capitalize">{activity.type.replace(/_/g, " ").toLowerCase()}</p>
                    {activity.details && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{activity.details}</p>
                    )}
                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1.5 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {new Date(activity.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div className="pt-2 text-center">
                <Link href="/dashboard/analytics" className="text-sm text-blue-600 hover:underline">
                  View full timeline
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No recent activity. Start learning to see your progress!</p>
          )}
        </div>
      </div>
    </div>
  );
}
