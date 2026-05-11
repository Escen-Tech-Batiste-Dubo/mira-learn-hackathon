"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError, apiClient } from "@/lib/api-client";
import type {
  MiraClass,
  MiraClassCreatePayload,
  MiraClassDeliveryFormat,
  Skill,
  SkillListResponse,
} from "@/types";

const FORMAT_OPTIONS: Array<{
  value: MiraClassDeliveryFormat;
  label: string;
  description: string;
}> = [
  {
    value: "virtual",
    label: "Live virtuel",
    description: "Une cohorte en visio avec un rythme clair.",
  },
  {
    value: "physical",
    label: "Présentiel",
    description: "Une cohorte ancrée dans un lieu pour les nomades.",
  },
  {
    value: "both",
    label: "Hybride",
    description: "Un parcours qui combine présentiel et visio.",
  },
  {
    value: "async",
    label: "Asynchrone",
    description: "Un parcours autonome, stocké comme self-paced.",
  },
];

type FormErrors = {
  title?: string;
  description?: string;
  skillIds?: string;
  submit?: string;
};

function validateForm(title: string, description: string, skillIds: string[]): FormErrors {
  const errors: FormErrors = {};
  if (title.trim().length < 3) {
    errors.title = "Ajoute un titre d'au moins 3 caractères.";
  }
  if (description.trim().length < 20) {
    errors.description = "Ajoute une description d'au moins 20 caractères.";
  }
  if (skillIds.length === 0) {
    errors.skillIds = "Sélectionne au moins une skill enseignée.";
  }
  if (skillIds.length > 8) {
    errors.skillIds = "Garde un maximum de 8 skills pour une Mira Class lisible.";
  }
  return errors;
}

function getSkillButtonClass(selected: boolean) {
  if (selected) {
    return "border-[var(--primary)] bg-[var(--background)] text-[var(--foreground)] ring-1 ring-[var(--primary)]";
  }
  return "border-[var(--border)] bg-[var(--color-card)] text-[var(--foreground)] hover:bg-[var(--background)]";
}

export default function NewMiraClassPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryFormat, setDeliveryFormat] = useState<MiraClassDeliveryFormat>("virtual");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    let mounted = true;

    apiClient
      .get<SkillListResponse>("/v1/skills")
      .then((payload) => {
        if (!mounted) {
          return;
        }
        setSkills(payload.items);
        setSkillsError(null);
      })
      .catch((error: unknown) => {
        if (!mounted) {
          return;
        }
        if (error instanceof ApiError || error instanceof Error) {
          setSkillsError(error.message);
          return;
        }
        setSkillsError("On n'a pas réussi à charger les skills.");
      })
      .finally(() => {
        if (mounted) {
          setSkillsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const selectedSkills = useMemo(
    () => skills.filter((skill) => selectedSkillIds.includes(skill.id)),
    [selectedSkillIds, skills],
  );

  function toggleSkill(skillId: string) {
    setSelectedSkillIds((current) => {
      if (current.includes(skillId)) {
        return current.filter((item) => item !== skillId);
      }
      return [...current, skillId];
    });
    setErrors((current) => ({ ...current, skillIds: undefined, submit: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateForm(title, description, selectedSkillIds);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    const payload: MiraClassCreatePayload = {
      title: title.trim(),
      description: description.trim(),
      skill_ids: selectedSkillIds,
      delivery_format: deliveryFormat,
    };

    try {
      await apiClient.post<MiraClass>("/v1/classes", payload);
      router.push("/dashboard/classes");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError || error instanceof Error) {
        setErrors({ submit: error.message });
      } else {
        setErrors({ submit: "On n'a pas réussi à créer ta Mira Class." });
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link
          href="/dashboard/classes"
          className="text-sm font-semibold text-[var(--primary)] hover:opacity-80"
        >
          Retour aux Mira Classes
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Créer une Mira Class</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Pose la base du parcours : titre, promesse, skills enseignées et format.
          </p>
        </div>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-semibold">
              Titre
            </label>
            <input
              id="title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((current) => ({ ...current, title: undefined, submit: undefined }));
              }}
              maxLength={200}
              placeholder="Ex : Pitcher pour lever 500k"
              className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.title && (
              <p className="text-sm text-[var(--color-destructive)]">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-semibold">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(event) => {
                setDescription(event.target.value);
                setErrors((current) => ({
                  ...current,
                  description: undefined,
                  submit: undefined,
                }));
              }}
              maxLength={4000}
              rows={6}
              placeholder="Explique à quel nomade ce parcours s'adresse, ce qu'il va apprendre et le résultat attendu."
              className="min-h-36 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-3 py-3 text-sm outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
            />
            <div className="flex justify-between gap-4 text-xs text-[var(--muted-foreground)]">
              <span>{errors.description ?? "Minimum 20 caractères pour aider les apprenants à se projeter."}</span>
              <span>{description.length}/4000</span>
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Skills enseignées</legend>
            {skillsLoading && (
              <div className="grid gap-2 sm:grid-cols-2">
                {[0, 1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="h-11 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--background)]"
                  />
                ))}
              </div>
            )}

            {!skillsLoading && skillsError && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4">
                <p className="text-sm font-semibold">Chargement des skills impossible</p>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{skillsError}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </Button>
              </div>
            )}

            {!skillsLoading && !skillsError && (
              <div className="grid gap-2 sm:grid-cols-2">
                {skills.map((skill) => {
                  const selected = selectedSkillIds.includes(skill.id);
                  return (
                    <button
                      key={skill.id}
                      type="button"
                      onClick={() => toggleSkill(skill.id)}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${getSkillButtonClass(selected)}`}
                      aria-pressed={selected}
                    >
                      <span className="block font-semibold">{skill.name}</span>
                      <span className="mt-0.5 block text-xs text-[var(--muted-foreground)]">
                        {skill.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2 text-xs text-[var(--muted-foreground)]">
              <span>{selectedSkills.length} skill(s) sélectionnée(s)</span>
              {selectedSkills.map((skill) => (
                <span
                  key={skill.id}
                  className="rounded-full border border-[var(--border)] bg-[var(--background)] px-2 py-1"
                >
                  {skill.name}
                </span>
              ))}
            </div>
            {errors.skillIds && (
              <p className="text-sm text-[var(--color-destructive)]">{errors.skillIds}</p>
            )}
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold">Format</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {FORMAT_OPTIONS.map((option) => {
                const selected = deliveryFormat === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setDeliveryFormat(option.value);
                      setErrors((current) => ({ ...current, submit: undefined }));
                    }}
                    className={`rounded-lg border p-4 text-left transition-colors ${getSkillButtonClass(selected)}`}
                    aria-pressed={selected}
                  >
                    <span className="block text-sm font-semibold">{option.label}</span>
                    <span className="mt-1 block text-sm text-[var(--muted-foreground)]">
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {errors.submit && (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--color-destructive)]">
              {errors.submit}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-5 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/classes"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-card)] px-4 text-sm font-medium hover:bg-[var(--background)]"
            >
              Annuler
            </Link>
            <Button type="submit" disabled={submitting || skillsLoading || Boolean(skillsError)}>
              {submitting ? "Création..." : "Créer la Mira Class"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
