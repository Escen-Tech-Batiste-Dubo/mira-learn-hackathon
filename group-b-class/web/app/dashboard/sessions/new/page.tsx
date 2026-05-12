"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";

const formSchema = z.object({
  class_id: z.string().min(1, "Veuillez sélectionner une classe"),
  type: z.enum(["physical", "virtual", "hybrid"]),
  location_address: z.string().optional(),
  location_city: z.string().optional(),
  location_country: z.string().optional(),
  capacity: z.number().min(1).max(50),
  price_cents: z.number().min(0),
  starts_at: z.string().min(1, "Date/heure de début requise"),
  ends_at: z.string().min(1, "Date/heure de fin requise"),
  waitlist_enabled: z.boolean().default(true),
  waitlist_max_size: z.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateSessionPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState<"physical" | "virtual" | "hybrid">("virtual");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "virtual",
      capacity: 10,
      price_cents: 0,
      waitlist_enabled: true,
      waitlist_max_size: 20,
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    fetchClasses();
  }, [user, loading, router]);

  const fetchClasses = async () => {
    try {
      const response = await apiClient.get("/v1/me/classes");
      if (response.data && Array.isArray(response.data)) {
        setClasses(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch classes:", err);
    }
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);

      // Valider que location_address est requis pour physical/hybrid
      if (values.type !== "virtual" && !values.location_address) {
        form.setError("location_address", {
          type: "manual",
          message: "L'adresse est requise pour les sessions en présentiel",
        });
        return;
      }

      const payload = {
        ...values,
        price_cents: Math.floor(values.price_cents * 100), // Convert to cents
      };

      const response = await apiClient.post(
        `/v1/classes/${values.class_id}/sessions`,
        payload
      );

      if (response.status === "success") {
        router.push(`/dashboard/sessions/${response.data.id}`);
      }
    } catch (err) {
      console.error("Failed to create session:", err);
      // Show error toast or message
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Créer une session</h1>
        <p className="text-muted-foreground mt-2">
          Ajoutez une nouvelle session à l'une de vos classes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Détails de la session</CardTitle>
          <CardDescription>
            Complétez les informations pour créer une session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Classe */}
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classe</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une classe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Type de session */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Format de session</FormLabel>
                    <Select
                      onValueChange={(value: any) => {
                        field.onChange(value);
                        setSelectedType(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="virtual">En ligne (Zoom, Meet, etc.)</SelectItem>
                        <SelectItem value="physical">En présentiel</SelectItem>
                        <SelectItem value="hybrid">Hybride (présentiel + en ligne)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adresse (si physical/hybrid) */}
              {selectedType !== "virtual" && (
                <>
                  <FormField
                    control={form.control}
                    name="location_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse</FormLabel>
                        <FormControl>
                          <Input placeholder="10 Rue de la Paix, Paris" {...field} />
                        </FormControl>
                        <FormDescription>
                          Adresse complète du lieu
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location_city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location_country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pays</FormLabel>
                          <FormControl>
                            <Input placeholder="France" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}

              {/* Capacité */}
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacité maximale</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Entre 1 et 50 participants</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prix */}
              <FormField
                control={form.control}
                name="price_cents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix par participant (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Laisser à 0 pour gratuit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dates et heures */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Début</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fin</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Waitlist */}
              <FormField
                control={form.control}
                name="waitlist_enabled"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="waitlist"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                      <label htmlFor="waitlist" className="font-medium cursor-pointer">
                        Activer la liste d'attente
                      </label>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("waitlist_enabled") && (
                <FormField
                  control={form.control}
                  name="waitlist_max_size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Taille maximale liste d'attente</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Création..." : "Créer la session"}
                </Button>
                <Link href="/dashboard/sessions">
                  <Button variant="outline">Annuler</Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

