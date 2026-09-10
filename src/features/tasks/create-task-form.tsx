"use client";

import { useRef, useState } from "react";
import { createTask } from "./actions";
import { analyzeTaskAction } from "./ai-actions";
import { PlusCircle, Sparkles } from "lucide-react";

export function CreateTaskForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [isAiPending, setIsAiPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Controlled states for AI auto-fill
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Kerja");
  const [priority, setPriority] = useState("medium");
  const [estimatedMinutes, setEstimatedMinutes] = useState("30");

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setErrorMsg(null);
    
    // Generate UUID di client (Web Crypto API) untuk idempotency
    const clientRequestId = crypto.randomUUID();
    
    const result = await createTask(formData, clientRequestId);
    
    if (result.ok) {
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("Kerja");
      setPriority("medium");
      setEstimatedMinutes("30");
      formRef.current?.reset();
    } else {
      setErrorMsg(result.error.message || "Gagal membuat tugas");
    }
    
    setIsPending(false);
  }

  async function handleAIAnalysis() {
    if (!title.trim()) {
      setErrorMsg("Isi judul tugas terlebih dahulu untuk dianalisis AI.");
      return;
    }

    setIsAiPending(true);
    setErrorMsg(null);

    const result = await analyzeTaskAction(title, description);

    if (result.ok) {
      setCategory(result.data.category);
      setEstimatedMinutes(result.data.estimated_minutes.toString());
    } else {
      setErrorMsg(result.error.message || "Gagal menganalisis dengan AI.");
    }

    setIsAiPending(false);
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
        <PlusCircle className="h-5 w-5 text-primary" />
        Tambah Tugas Baru
      </h2>
      
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="title" className="text-sm font-medium">Judul Tugas</label>
            <input
              id="title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={100}
              placeholder="Contoh: Buat slide presentasi meeting bulanan"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="description" className="text-sm font-medium">Deskripsi (opsional)</label>
            <textarea
              id="description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Catatan tambahan..."
              className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="category" className="text-sm font-medium">Kategori</label>
            <select
              id="category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="Kerja">Kerja</option>
              <option value="Belajar">Belajar</option>
              <option value="Pribadi">Pribadi</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="priority" className="text-sm font-medium">Prioritas</label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="urgent">🔴 Urgent (P1)</option>
              <option value="high">🟠 High (P2)</option>
              <option value="medium">🟣 Medium (P3)</option>
              <option value="low">⚪ Low (P4)</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="estimated_minutes" className="text-sm font-medium">Estimasi (menit)</label>
            <input
              id="estimated_minutes"
              name="estimated_minutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              required
              min={1}
              max={1440}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button
            type="submit"
            disabled={isPending || isAiPending}
            className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Menyimpan..." : "Simpan Tugas"}
          </button>
          
          <button
            type="button"
            onClick={handleAIAnalysis}
            disabled={isPending || isAiPending || !title.trim()}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-input bg-secondary px-4 py-2.5 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 text-purple-500" />
            {isAiPending ? "Menganalisis..." : "Tebak Kategori dengan AI"}
          </button>
        </div>
      </form>
    </div>
  );
}
