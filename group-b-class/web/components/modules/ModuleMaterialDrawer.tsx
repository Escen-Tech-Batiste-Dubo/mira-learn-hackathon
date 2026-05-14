"use client";

import { useCallback, useEffect, useState } from "react";

import { ApiError, apiClient } from "@/lib/api-client";
import { isModuleMaterialUploadConfigured, uploadModuleMaterialFile } from "@/lib/upload-module-material";

type SessionOption = {
  id: string;
  starts_at: string;
  location_city?: string | null;
  location_country?: string | null;
};

type MaterialRow = {
  id: string;
  phase: string;
  material_type: string;
  material_url: string;
  label: string;
  description: string;
  ordering: number;
  required: boolean;
};

function formatSessionLabel(s: SessionOption): string {
  const start = new Date(s.starts_at);
  const loc = [s.location_city, s.location_country].filter(Boolean).join(", ");
  const dateStr = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const timeStr = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return loc ? `${dateStr} à ${timeStr} — ${loc}` : `${dateStr} à ${timeStr}`;
}

function guessMimeFromUrl(url: string, materialKind: string): string | undefined {
  const u = url.split("?")[0]?.toLowerCase() ?? "";
  if (u.endsWith(".pdf")) {
    return "application/pdf";
  }
  if (u.endsWith(".png")) {
    return "image/png";
  }
  if (u.endsWith(".jpg") || u.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (materialKind === "image") {
    return "image/jpeg";
  }
  if (materialKind === "pdf") {
    return "application/pdf";
  }
  return undefined;
}

type ModuleMaterialDrawerProps = {
  open: boolean;
  classId: string;
  moduleId: string;
  moduleTitle: string;
  sessions: SessionOption[];
  sessionsLoading: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

/**
 * Drawer « Matériel » par module — persistance via API (session_module + materials).
 */
export function ModuleMaterialDrawer({
  open,
  classId,
  moduleId,
  moduleTitle,
  sessions,
  sessionsLoading,
  onClose,
  onSaved,
}: ModuleMaterialDrawerProps) {
  const [sessionId, setSessionId] = useState("");
  const [materialKind, setMaterialKind] = useState<"link" | "pdf" | "image">("link");
  const [phase, setPhase] = useState<"before" | "during" | "after">("before");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState("0");
  const [mandatory, setMandatory] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [infoTone, setInfoTone] = useState<"info" | "error">("info");
  const [listLoading, setListLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const loadMaterials = useCallback(async () => {
    if (!classId || !moduleId || !sessionId) {
      setMaterials([]);
      return;
    }
    setListLoading(true);
    try {
      const data = await apiClient.get<{ materials: MaterialRow[] }>(
        `/v1/classes/${classId}/sessions/${sessionId}/modules/${moduleId}/materials`,
      );
      setMaterials(Array.isArray(data.materials) ? data.materials : []);
    } catch {
      setMaterials([]);
    } finally {
      setListLoading(false);
    }
  }, [classId, moduleId, sessionId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    setInfo(null);
    setPendingFile(null);
    setSessionId(sessions[0]?.id ?? "");
    setTitle("");
    setUrl("");
    setDescription("");
    setOrder("0");
    setMandatory(false);
    setMaterialKind("link");
    setPhase("before");
  }, [open, sessions]);

  useEffect(() => {
    if (!open || !sessionId || !moduleId) {
      return;
    }
    void loadMaterials();
  }, [open, sessionId, moduleId, loadMaterials]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(): void {
    setInfo(null);
    onClose();
  }

  async function handleSave(): Promise<void> {
    setInfo(null);
    if (!sessionId) {
      setInfoTone("error");
      setInfo("Choisis une session cible.");
      return;
    }
    if (!title.trim()) {
      setInfoTone("error");
      setInfo("Le titre est obligatoire.");
      return;
    }

    let finalUrl = url.trim();
    let materialType: "file" | "link" = "link";
    let fileSizeBytes: number | undefined;
    let fileMimeType: string | undefined;

    if (materialKind === "link") {
      materialType = "link";
      if (!finalUrl) {
        setInfoTone("error");
        setInfo("Colle une URL (vidéo, article, drive public…).");
        return;
      }
    } else {
      materialType = "file";
      if (pendingFile) {
        if (!isModuleMaterialUploadConfigured()) {
          setInfoTone("error");
          setInfo(
            "Upload fichier : ajoute NEXT_PUBLIC_SUPABASE_MODULE_MATERIAL_BUCKET (bucket public) ou colle une URL HTTPS vers ton PDF / image.",
          );
          return;
        }
      } else if (!finalUrl) {
        setInfoTone("error");
        setInfo("Choisis un fichier ou colle une URL publique vers ton PDF / image.");
        return;
      }
      if (!pendingFile && finalUrl) {
        fileMimeType = guessMimeFromUrl(finalUrl, materialKind);
      }
    }

    const ordering = Number.parseInt(order, 10);
    setSaveLoading(true);
    try {
      if (materialKind !== "link" && pendingFile && isModuleMaterialUploadConfigured()) {
        const uploaded = await uploadModuleMaterialFile({
          classId,
          sessionId,
          moduleId,
          file: pendingFile,
        });
        finalUrl = uploaded.url;
        fileSizeBytes = uploaded.size;
        fileMimeType = uploaded.mimeType;
      }

      const body = {
        phase,
        material_type: materialType,
        material_url: finalUrl,
        file_size_bytes: fileSizeBytes ?? null,
        file_mime_type: fileMimeType ?? null,
        label: title.trim(),
        description: description.trim(),
        ordering: Number.isFinite(ordering) ? ordering : 0,
        required: mandatory,
      };

      await apiClient.post(
        `/v1/classes/${classId}/sessions/${sessionId}/modules/${moduleId}/materials`,
        body,
      );
      setPendingFile(null);
      setUrl("");
      setTitle("");
      setDescription("");
      setOrder("0");
      setMandatory(false);
      setInfoTone("info");
      setInfo("Matériel enregistré.");
      await loadMaterials();
      onSaved?.();
    } catch (e) {
      setInfoTone("error");
      if (e instanceof ApiError) {
        setInfo(e.message);
      } else {
        setInfo(e instanceof Error ? e.message : "Enregistrement impossible. Vérifie l’URL ou réessaie.");
      }
    } finally {
      setSaveLoading(false);
    }
  }

  const uploadConfigured = isModuleMaterialUploadConfigured();

  return (
    <>
      <div
        aria-hidden={!open}
        className="fixed inset-0 z-40 bg-[#1D1D1B]/40"
        onClick={handleBackdropClick}
      />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-[#E5E7EB] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#888888]">Matériel</p>
            <h2 className="mt-1 font-[Playfair_Display] text-lg font-bold text-[#1D1D1B]">{moduleTitle}</h2>
            <p className="mt-1 text-xs text-[#888888]">
              Ressources par session (avant / pendant / après). PDF, image (URL ou upload Storage) ou lien externe.
            </p>
          </div>
          <button
            className="rounded-md p-2 text-[#888888] hover:bg-[#E2DCD3] hover:text-[#1D1D1B]"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {info ? (
            <div
              className={
                infoTone === "error"
                  ? "mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-950"
                  : "mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
              }
            >
              {info}
            </div>
          ) : null}

          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold text-[#1D1D1B]">Déjà ajouté</p>
            {listLoading ? (
              <p className="text-xs text-[#888888]">Chargement…</p>
            ) : materials.length === 0 ? (
              <p className="text-xs text-[#888888]">Aucun matériel pour cette session.</p>
            ) : (
              <ul className="max-h-40 space-y-2 overflow-y-auto text-xs">
                {materials.map((m) => (
                  <li key={m.id} className="rounded-lg border border-[#E5E7EB] bg-[#FAFAF9] px-3 py-2">
                    <span className="font-semibold text-[#1D1D1B]">{m.label}</span>
                    <span className="ml-2 text-[#888888]">
                      ({m.phase} · {m.material_type})
                    </span>
                    <div className="mt-1 truncate font-mono text-[10px] text-[#888888]">{m.material_url}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Session cible</label>
              <select
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 outline-none focus:ring-1 focus:ring-[#E6332A]"
                disabled={sessionsLoading || sessions.length === 0}
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                {sessionsLoading ? (
                  <option>Chargement…</option>
                ) : sessions.length === 0 ? (
                  <option value="">Aucune session — crée une session d&apos;abord</option>
                ) : (
                  sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatSessionLabel(s)}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Type</label>
              <select
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 outline-none focus:ring-1 focus:ring-[#E6332A]"
                value={materialKind}
                onChange={(e) => {
                  setMaterialKind(e.target.value as "link" | "pdf" | "image");
                  setPendingFile(null);
                }}
              >
                <option value="link">Lien externe (vidéo, article…)</option>
                <option value="pdf">PDF</option>
                <option value="image">Image</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Phase</label>
              <select
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 outline-none focus:ring-1 focus:ring-[#E6332A]"
                value={phase}
                onChange={(e) => setPhase(e.target.value as "before" | "during" | "after")}
              >
                <option value="before">Avant</option>
                <option value="during">Pendant</option>
                <option value="after">Après</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Titre *</label>
              <input
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 outline-none focus:ring-1 focus:ring-[#E6332A]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ressource"
              />
            </div>
            {materialKind === "link" ? (
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">URL *</label>
                <input
                  className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 font-mono text-xs outline-none focus:ring-1 focus:ring-[#E6332A]"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://…"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">
                    Fichier {uploadConfigured ? "" : "(upload désactivé — colle une URL)"}
                  </label>
                  <input
                    className="w-full text-xs"
                    type="file"
                    accept={materialKind === "pdf" ? ".pdf,application/pdf" : "image/*"}
                    disabled={!uploadConfigured}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setPendingFile(f ?? null);
                    }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">
                    Ou URL publique (https)
                  </label>
                  <input
                    className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 font-mono text-xs outline-none focus:ring-1 focus:ring-[#E6332A]"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Description</label>
              <textarea
                className="min-h-[80px] w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 outline-none focus:ring-1 focus:ring-[#E6332A]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[#1D1D1B]">Ordre</label>
              <input
                className="h-11 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 outline-none focus:ring-1 focus:ring-[#E6332A]"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-[#1D1D1B]">
              <input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
              Lecture obligatoire
            </label>
          </div>
        </div>

        <div className="border-t border-[#E5E7EB] px-5 py-4">
          <button
            className="h-11 w-full rounded-lg bg-[#E6332A] text-sm font-semibold text-white hover:opacity-95 disabled:opacity-60"
            type="button"
            disabled={saveLoading || sessions.length === 0}
            onClick={() => void handleSave()}
          >
            {saveLoading ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </aside>
    </>
  );
}
