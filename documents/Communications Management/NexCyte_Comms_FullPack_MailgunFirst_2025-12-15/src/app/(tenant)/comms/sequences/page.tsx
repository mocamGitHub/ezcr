import Link from "next/link";
import { listSequences } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function SequencesPage() {
  const sequences = await listSequences();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sequences</h1>
          <p className="text-sm text-muted-foreground">Build multi-step flows. Execution can be driven by n8n or a worker.</p>
        </div>
        <Button asChild><Link href="/comms/sequences/new">New Sequence</Link></Button>
      </div>

      <div className="grid gap-3">
        {sequences.map((s: any) => (
          <Card key={s.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.status}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Updated {new Date(s.updated_at).toLocaleString()}</div>
          </Card>
        ))}
        {!sequences.length && <div className="text-sm text-muted-foreground">No sequences yet.</div>}
      </div>
    </div>
  );
}
