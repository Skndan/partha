import { Badge } from "@workspace/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  FEATURE_MATRIX,
  type FeatureStatus,
} from "@/lib/marketing/feature-matrix";

function statusVariant(status: FeatureStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "Available":
      return "default";
    case "In progress":
      return "secondary";
    default:
      return "outline";
  }
}

export function FeatureMatrixSection() {
  return (
    <div className="space-y-12">
      {FEATURE_MATRIX.map((block) => (
        <section key={block.pillar} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-foreground text-2xl font-semibold tracking-tight">{block.pillar}</h2>
            <p className="text-muted-foreground">{block.summary}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {block.rows.map((row) => (
              <Card key={row.name} className="border-border">
                <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 pb-2">
                  <CardTitle className="text-base">{row.name}</CardTitle>
                  <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription>{row.detail}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
