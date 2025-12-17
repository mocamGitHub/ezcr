"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReplyComposer(props: {
  conversationId: string;
  contactId: string;
  channel: "email" | "sms";
  templateVersions: Array<{ id: string; label: string }>;
  onSend: (args: { templateVersionId: string; variables: any }) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [templateVersionId, setTemplateVersionId] = useState(props.templateVersions[0]?.id ?? "");
  const [varsJson, setVarsJson] = useState(JSON.stringify({ contact: { display_name: "Customer" } }, null, 2));

  const canSend = useMemo(() => Boolean(templateVersionId), [templateVersionId]);

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="text-sm font-medium">Reply</div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Canned template</div>
          <Select value={templateVersionId} onValueChange={setTemplateVersionId}>
            <SelectTrigger><SelectValue placeholder="Choose template" /></SelectTrigger>
            <SelectContent>
              {props.templateVersions.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Variables (JSON)</div>
          <Textarea value={varsJson} onChange={(e) => setVarsJson(e.target.value)} className="min-h-[120px]" />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          disabled={!canSend || pending}
          onClick={() => start(async () => {
            const vars = JSON.parse(varsJson || "{}");
            await props.onSend({ templateVersionId, variables: vars });
          })}
        >
          {pending ? "Sending..." : "Send"}
        </Button>
      </div>
    </div>
  );
}
