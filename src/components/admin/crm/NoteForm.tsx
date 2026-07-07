"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { encodeCrmId } from "@/lib/crm-types";
import type { CrmRecordType } from "@/lib/crm-types";
import { useToast } from "@/components/ui/Toast";
import { Spinner } from "@/components/ui/Spinner";

interface NoteFormProps {
  recordType: CrmRecordType;
  recordId: number;
}

export function NoteForm({ recordType, recordId }: NoteFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    try {
      const res = await fetch(`/api/admin/crm/${encodeCrmId(recordType, recordId)}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, recordType }),
      });
      if (!res.ok) {
        toast.error("Couldn't save the note. Please try again.");
        return;
      }
      setBody("");
      toast.success("Note added.");
      router.refresh();
    } catch {
      toast.error("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="note-body" className="text-sm text-(--text-secondary)">
        Add a note
      </label>
      <textarea
        id="note-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Enter note…"
        className="rounded-lg border border-(--border-color) bg-(--bg-primary) text-(--text-primary) px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-(--text-secondary)"
      />
      <div>
        <button
          type="submit"
          disabled={pending || !body.trim()}
          className="btn-metallic px-4 py-2 text-sm rounded-lg disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner /> Adding…
            </span>
          ) : (
            "Add note"
          )}
        </button>
      </div>
    </form>
  );
}
