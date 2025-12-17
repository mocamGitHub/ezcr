"use client";

import { useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TemplatePreviewTab(props: {
  templateId: string;
  versionId: string | null;
  placeholders: string[];
  channel?: string;
}) {
  const [varsJson, setVarsJson] = useState(
    JSON.stringify(
      {
        contact: { display_name: "Customer", email: "customer@example.com", phone_e164: "+15555550123" },
        order: { number: "EZCR-1024", total: "$4,100" },
      },
      null,
      2
    )
  );

  const varsB64 = useMemo(() => {
    try {
      const obj = JSON.parse(varsJson);
      return btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    } catch {
      return "";
    }
  }, [varsJson]);

  const iframeSrc = useMemo(() => {
    if (!props.versionId || !varsB64) return "";
    return `/comms/templates/${props.templateId}/preview?versionId=${encodeURIComponent(props.versionId)}&vars=${encodeURIComponent(varsB64)}&mode=html`;
  }, [props.templateId, props.versionId, varsB64]);

  const textSrc = useMemo(() => {
    if (!props.versionId || !varsB64) return "";
    return `/comms/templates/${props.templateId}/preview?versionId=${encodeURIComponent(props.versionId)}&vars=${encodeURIComponent(varsB64)}&mode=text`;
  }, [props.templateId, props.versionId, varsB64]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border p-4 space-y-2">
        <div className="text-sm font-medium">Placeholders detected</div>
        <div className="text-xs text-muted-foreground">
          {props.placeholders.length ? props.placeholders.join(", ") : "None detected."}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <div className="text-sm font-medium">Sample Variables (JSON)</div>
          <Textarea value={varsJson} onChange={(e) => setVarsJson(e.target.value)} className="min-h-[240px]" />
          <div className="text-xs text-muted-foreground">
            Uses {{`{{var}}`}} or {{{`{{{var}}}`}}}. Nested paths supported (e.g. contact.display_name).
          </div>
        </div>

        <div className="space-y-2">
          <Tabs defaultValue="html">
            <TabsList>
              <TabsTrigger value="html">HTML Preview</TabsTrigger>
              <TabsTrigger value="text">Text Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-2">
              {props.versionId ? (
                <iframe
                  title="Template HTML Preview"
                  src={iframeSrc}
                  className="w-full h-[360px] rounded-md border bg-background"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="text-sm text-muted-foreground">No version available to preview.</div>
              )}
            </TabsContent>

            <TabsContent value="text" className="space-y-2">
              {props.versionId ? (
                <iframe title="Template Text Preview" src={textSrc} className="w-full h-[360px] rounded-md border" sandbox="allow-same-origin" />
              ) : (
                <div className="text-sm text-muted-foreground">No version available to preview.</div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
