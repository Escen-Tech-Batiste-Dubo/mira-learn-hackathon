"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Save, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Skill, SkillListResponse, MiraClass, MiraClassDeliveryFormat } from "@/types";

const FORMAT_OPTIONS: { value: MiraClassDeliveryFormat; label: string; description: string }[] = [
  { value: "virtual", label: "Live virtuel", description: "En visio avec un rythme fixe." },
  { value: "physical", label: "Présentiel", description: "En face à face dans un lieu dédié." },
  { value: "both", label: "Hybride", description: "Mélange de présentiel et de visio." },
];

export default function EditMiraClassPage() {
  const router = useRouter();
  const { id } = useParams(); // Récupère l'ID de la classe dans l'URL
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    delivery_format: "virtual" as MiraClassDeliveryFormat,
  });

  // 1. Charger les données initiales
  useEffect(() => {
    async function init() {
      try {
        const [skillsRes, classRes] = await Promise.all([
          apiClient.get<SkillListResponse>("/v1/skills"),
          apiClient.get<MiraClass>(`/v1/classes/${id}`)
        ]);
        
        setSkills(skillsRes.items);
        setFormData({
          title: classRes.title,
          description: classRes.description,
          delivery_format: classRes.format_envisaged as MiraClassDeliveryFormat,
        });
        setSelectedSkillIds(classRes.skills_taught || []);
      } catch (err) {
        alert("Impossible de charger les données de la classe.");
        router.push("/dashboard/classes");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, router]);

  const isFormValid = formData.title.length >= 3 && formData.description.length >= 20 && selectedSkillIds.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put(`/v1/classes/${id}`, {
        ...formData,
        skill_ids: selectedSkillIds,
      });
      router.push("/dashboard/classes");
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8 px-4">
      <header>
        <Link href="/dashboard/classes" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour aux classes
        </Link>
        <h1 className="mt-4 font-serif text-4xl font-bold italic">Modifier la Mira Class</h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-8 p-6">
          {/* TITRE */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider">Titre</label>
            <input
              required
              className="w-full rounded-lg border border-[var(--border)] bg-transparent p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider">Description</label>
            <textarea
              required
              rows={5}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* SKILLS (Réutilisation de la logique de toggle) */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider">Compétences</label>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => {
                const isSelected = selectedSkillIds.includes(skill.id);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => setSelectedSkillIds(prev => isSelected ? prev.filter(id => id !== skill.id) : [...prev, skill.id])}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                      isSelected ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--primary)]"
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    {skill.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FORMAT */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider">Format</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, delivery_format: opt.value })}
                  className={cn(
                    "flex flex-col rounded-xl border p-4 text-left transition-all",
                    formData.delivery_format === opt.value ? "border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--border)]"
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Button type="submit" disabled={submitting || !isFormValid} className="flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
}