"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ClientNoteFormProps {
  clientId: number;
}

export function ClientNoteForm({ clientId }: ClientNoteFormProps) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!body.trim()) return;
    setPending(true);
    try {
      await fetch(`/api/admin/clients/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      setBody("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor="client-note-body" className="text-sm text-(--text-secondary)">
        Add a note
      </label>
      <textarea
        id="client-note-body"
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
          {pending ? "Adding…" : "Add note"}
        </button>
      </div>
    </form>
  );
}
