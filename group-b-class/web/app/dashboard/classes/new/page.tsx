"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { Skill, SkillListResponse, MiraClassDeliveryFormat } from "@/types";

const FORMAT_OPTIONS: { value: MiraClassDeliveryFormat; label: string; description: string }[] = [
  { value: "virtual", label: "Live virtuel", description: "En visio avec un rythme fixe." },
  { value: "physical", label: "Présentiel", description: "En face à face dans un lieu dédié." },
  { value: "both", label: "Hybride", description: "Mélange de présentiel et de visio." },
];

export default function NewMiraClassPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    delivery_format: "virtual" as MiraClassDeliveryFormat,
  });

  useEffect(() => {
    apiClient.get<SkillListResponse>("/v1/skills")
      .then(res => setSkills(res.items))
      .catch(console.error);
  }, []);

  // --- VALIDATION LOGIC ---
  const isTitleValid = formData.title.trim().length >= 3;
  const isDescriptionValid = formData.description.trim().length >= 20;
  const hasSkills = selectedSkillIds.length > 0;
  const isFormValid = isTitleValid && isDescriptionValid && hasSkills;

  const toggleSkill = (id: string) => {
    setSelectedSkillIds(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    try {
      await apiClient.post("/v1/classes", {
        ...formData,
        skill_ids: selectedSkillIds,
      });
      router.push("/dashboard/classes");
      router.refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8 px-4">
      <header>
        <Link href="/dashboard/classes" className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Retour aux classes
        </Link>
        <h1 className="mt-4 font-serif text-4xl font-bold italic">Nouvelle Mira Class</h1>
        <p className="text-[var(--muted-foreground)] mt-1">Définissez les bases de votre nouveau parcours d'apprentissage.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="space-y-8 p-6">
          {/* TITRE */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-wider">Titre de la class</label>
              <span className={cn("text-[10px]", isTitleValid ? "text-green-500" : "text-[var(--muted-foreground)]")}>
                {formData.title.length} / 3 min.
              </span>
            </div>
            <input
              required
              className="w-full rounded-lg border border-[var(--border)] bg-transparent p-3 outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              placeholder="Ex: Maîtriser le pitch investisseur en 2 jours"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
            {!isTitleValid && formData.title.length > 0 && (
              <p className="text-[10px] text-orange-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Le titre doit faire au moins 3 caractères.
              </p>
            )}
          </div>

          {/* DESCRIPTION */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-xs font-bold uppercase tracking-wider">Description du parcours</label>
              <span className={cn("text-[10px]", isDescriptionValid ? "text-green-500" : "text-[var(--muted-foreground)]")}>
                {formData.description.length} / 20 min.
              </span>
            </div>
            <textarea
              required
              rows={4}
              className="w-full rounded-lg border border-[var(--border)] bg-transparent p-3 outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              placeholder="Décrivez les objectifs, le public cible et ce que les apprenants vont accomplir..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <p className="text-[11px] text-[var(--muted-foreground)]">
              Soyez précis : une description de plus de 20 caractères est requise pour la validation.
            </p>
          </div>

          {/* SKILLS */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider">Compétences enseignées (1 minimum)</label>
            <div className="flex flex-wrap gap-2">
              {skills.map(skill => (
                <button
                  key={skill.id}
                  type="button"
                  onClick={() => toggleSkill(skill.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
                    selectedSkillIds.includes(skill.id)
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                      : "border-[var(--border)] bg-[var(--background)] hover:border-[var(--muted-foreground)]"
                  )}
                >
                  <Sparkles className={cn("h-3 w-3", selectedSkillIds.includes(skill.id) ? "text-white" : "text-[var(--primary)]")} />
                  {skill.name}
                </button>
              ))}
            </div>
            {!hasSkills && (
              <p className="text-[11px] text-orange-500 italic">Veuillez sélectionner au moins une compétence pour continuer.</p>
            )}
          </div>

          {/* FORMAT */}
          <div className="space-y-3 border-t border-[var(--border)] pt-6">
            <label className="text-xs font-bold uppercase tracking-wider">Format envisagé</label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {FORMAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, delivery_format: opt.value })}
                  className={cn(
                    "flex flex-col rounded-xl border p-4 text-left transition-all",
                    formData.delivery_format === opt.value
                      ? "border-[var(--primary)] ring-1 ring-[var(--primary)] bg-[var(--primary)]/5"
                      : "border-[var(--border)] hover:border-[var(--muted-foreground)]"
                  )}
                >
                  <span className="font-bold text-sm">{opt.label}</span>
                  <span className="text-[10px] text-[var(--muted-foreground)] mt-1 leading-relaxed">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ACTIONS */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/dashboard/classes">
            <Button variant="outline" type="button">Annuler</Button>
          </Link>
          <Button 
            type="submit" 
            disabled={loading || !isFormValid}
            className={cn(!isFormValid && "opacity-50 cursor-not-allowed")}
          >
            {loading ? "Création en cours..." : "Créer la Mira Class"}
          </Button>
        </div>
      </form>
    </div>
  );
}