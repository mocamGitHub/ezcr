import Link from "next/link";
import { listTemplates } from "./actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TemplatesPage() {
  const templates = await listTemplates();

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Templates</h1>
          <p className="text-sm text-muted-foreground">Immutable versions with publish/rollback via active_version_id.</p>
        </div>
        <Button asChild><Link href="/comms/templates/new">New Template</Link></Button>
      </div>

      <div className="grid gap-3">
        {templates.map((t: any) => (
          <Link key={t.id} href={`/comms/templates/${t.id}`}>
            <Card className="p-4 hover:bg-muted/50 transition">
              <div className="flex items-center justify-between">
                <div className="font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground uppercase">{t.channel}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t.status} • Updated {new Date(t.updated_at).toLocaleString()}
              </div>
            </Card>
          </Link>
        ))}
        {!templates.length && <div className="text-sm text-muted-foreground">No templates yet.</div>}
      </div>
    </div>
  );
}
