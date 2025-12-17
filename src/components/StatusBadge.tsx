import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = "new" | "in-progress" | "waiting-approval" | "submitted" | "won" | "lost";

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig = {
  new: { label: "New", className: "bg-accent text-accent-foreground" },
  "in-progress": { label: "In Progress", className: "bg-primary text-primary-foreground" },
  "waiting-approval": { label: "Waiting Approval", className: "bg-warning text-warning-foreground" },
  submitted: { label: "Submitted", className: "bg-muted text-muted-foreground" },
  won: { label: "Won", className: "bg-success text-success-foreground" },
  lost: { label: "Lost", className: "bg-destructive text-destructive-foreground" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  );
}
