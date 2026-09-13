"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Loader2, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { deleteMaterial } from "@/lib/actions/material";

type Material = {
  id: string;
  title: string;
  status: string;
  createdAt: Date;
};

export function MaterialsList({ 
  projectId, 
  initialMaterials 
}: { 
  projectId: string;
  initialMaterials: Material[] 
}) {
  const router = useRouter();
  
  const hasProcessingMaterials = initialMaterials.some(
    m => m.status === 'PENDING' || m.status === 'PROCESSING'
  );

  // Poll for updates if any material is processing
  useEffect(() => {
    if (hasProcessingMaterials) {
      const interval = setInterval(() => {
        router.refresh(); // Tells Next.js to re-fetch the server component data
      }, 3000); // Check every 3 seconds
      
      return () => clearInterval(interval);
    }
  }, [hasProcessingMaterials, router]);

  if (initialMaterials.length === 0) {
    return (
      <Card className="rounded-2xl border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center min-h-[200px]">
          <FileText className="h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No materials uploaded yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {initialMaterials.map((material) => (
        <Card key={material.id} className="rounded-xl border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow group overflow-hidden bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 space-y-0 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-medium text-slate-900 dark:text-slate-100">
                {material.title}
              </CardTitle>
              {material.status === 'COMPLETED' && <Badge variant="default" className="bg-green-600 ml-2"><CheckCircle2 className="mr-1 h-3 w-3"/> Ready</Badge>}
              {material.status === 'PROCESSING' && <Badge variant="secondary" className="ml-2"><Loader2 className="mr-1 h-3 w-3 animate-spin"/> Processing</Badge>}
              {material.status === 'ERROR' && <Badge variant="destructive" className="ml-2"><AlertCircle className="mr-1 h-3 w-3"/> Error</Badge>}
              {material.status === 'PENDING' && <Badge variant="outline" className="ml-2">Pending</Badge>}
            </div>
            <form action={deleteMaterial.bind(null, material.id, projectId)}>
              <Button type="submit" variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 transition-colors">
                <Trash2 className="h-4 w-4" />
              </Button>
            </form>
          </CardHeader>
          <CardContent className="pt-3 pb-4">
            <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Uploaded on {new Date(material.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
