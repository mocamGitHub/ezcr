import Link from "next/link";
import { listConversations } from "./actions";
import { Card } from "@/components/ui/card";

export default async function InboxPage() {
  const conversations = await listConversations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-sm text-muted-foreground">Unified threads across email + SMS.</p>
      </div>

      <div className="grid gap-3">
        {conversations.map((c: any) => (
          <Link key={c.id} href={`/comms/inbox/${c.id}`}>
            <Card className="p-4 hover:bg-muted/50 transition">
              <div className="flex items-center justify-between">
                <div className="font-medium">{c.subject ?? "(no subject)"}</div>
                <div className="text-xs text-muted-foreground uppercase">{c.channel}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {c.status} • Updated {new Date(c.updated_at).toLocaleString()}
              </div>
            </Card>
          </Link>
        ))}
        {!conversations.length && <div className="text-sm text-muted-foreground">No conversations yet.</div>}
      </div>
    </div>
  );
}
