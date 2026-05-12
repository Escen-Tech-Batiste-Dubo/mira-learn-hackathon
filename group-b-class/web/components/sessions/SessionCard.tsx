import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface SessionCardProps {
  id: string;
  class_id: string;
  type: "physical" | "virtual" | "hybrid";
  title?: string;
  location_city?: string;
  location_country?: string;
  capacity: number;
  status: string;
  starts_at: string;
  ends_at: string;
  enrolment_count: number;
  waitlist_count: number;
  price_cents: number;
}

export function SessionCard({
  id,
  type,
  title,
  location_city,
  location_country,
  capacity,
  status,
  starts_at,
  ends_at,
  enrolment_count,
  waitlist_count,
  price_cents,
}: SessionCardProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };
  const getTypeDisplay = () => {
    const types: Record<string, { label: string; icon: string }> = {
      physical: { label: "Présentiel", icon: "📍" },
      virtual: { label: "En ligne", icon: "🖥️" },
      hybrid: { label: "Hybride", icon: "🌐" },
    };
    return types[type] || { label: type, icon: "📌" };
  };

  const getStatusColor = (s: string) => {
    const colors: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planned: "default",
      open_enrolment: "secondary",
      full: "destructive",
      in_progress: "secondary",
      completed: "outline",
      cancelled: "destructive",
    };
    return colors[s] || "default";
  };

  const isAtCapacity = enrolment_count >= capacity;

  const typeDisplay = getTypeDisplay();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {title && <CardTitle>{title}</CardTitle>}
            <CardDescription>
              {typeDisplay.icon} {typeDisplay.label}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(status)}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Location */}
         <div className="text-sm">
           <p className="font-medium text-[var(--muted-foreground)]">Lieu</p>
           <p>
             {type === "virtual"
               ? "Session en ligne"
               : `${location_city || "À définir"}${location_country ? `, ${location_country}` : ""}`}
           </p>
         </div>

         {/* Dates */}
         <div className="grid grid-cols-2 gap-2 text-sm">
           <div>
             <p className="font-medium text-[var(--muted-foreground)]">Début</p>
             <p>{formatDate(starts_at)}</p>
           </div>
           <div>
             <p className="font-medium text-[var(--muted-foreground)]">Fin</p>
             <p>{formatDate(ends_at)}</p>
           </div>
         </div>

         {/* Capacity & Enrollments */}
         <div className="grid grid-cols-3 gap-2 text-sm">
           <div>
             <p className="font-medium text-[var(--muted-foreground)]">Capacité</p>
             <p>{capacity}</p>
           </div>
           <div>
             <p className="font-medium text-[var(--muted-foreground)]">Inscrits</p>
             <p className={isAtCapacity ? "text-destructive font-semibold" : ""}>
               {enrolment_count}/{capacity}
             </p>
           </div>
           {waitlist_count > 0 && (
             <div>
               <p className="font-medium text-[var(--muted-foreground)]">Waitlist</p>
               <p>{waitlist_count}</p>
             </div>
           )}
         </div>

        {/* Price */}
        {price_cents > 0 && (
          <div className="text-sm">
            <p className="font-medium text-muted-foreground">Prix par participant</p>
            <p>€{(price_cents / 100).toFixed(2)}</p>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          <Link href={`/dashboard/sessions/${id}`}>
            <Button size="sm" className="w-full" variant="outline">
              Voir & Éditer
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

