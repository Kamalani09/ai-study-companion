"use client";

import { useActionState } from "react";
import { uploadMaterial } from "@/lib/actions/material";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export function UploadMaterialForm({ projectId }: { projectId: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData(e.currentTarget);
      const res = await uploadMaterial(projectId, formData);
      if (res.success) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="file">PDF Document</Label>
        <Input 
          id="file" 
          name="file" 
          type="file" 
          accept="application/pdf" 
          required 
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Upload your study material in PDF format.
        </p>
      </div>

      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
          File uploaded successfully! It is now being processed.
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          "Upload Document"
        )}
      </Button>
    </form>
  );
}
