import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/comms/admin";
import { requireTenant } from "@/lib/comms/tenant";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TemplatePreviewTab } from "./components/TemplatePreviewTab";
import { getTemplatePreviewMeta } from "../actions.preview";
import { createTemplateVersion, publishTemplateVersion, archiveTemplate } from "../actions";

export default async function TemplateDetailPage({ params }: { params: { templateId: string } }) {
  const { tenantId } = requireTenant();
  const supabase = createSupabaseAdmin();

  const { data: tpl, error } = await supabase
    .from("comms_templates")
    .select("id,name,channel,status,active_version_id")
    .eq("tenant_id", tenantId)
    .eq("id", params.templateId)
    .single();
  if (error) throw error;

  const { data: versions, error: vErr } = await supabase
    .from("comms_template_versions")
    .select("id,version_number,created_at,subject")
    .eq("tenant_id", tenantId)
    .eq("template_id", params.templateId)
    .order("created_at", { ascending: false });
  if (vErr) throw vErr;

  const previewMeta = await getTemplatePreviewMeta({ templateId: params.templateId });

  async function onCreateVersion(formData: FormData) {
    "use server";
    const subject = String(formData.get("subject") ?? "");
    const textBody = String(formData.get("textBody") ?? "");
    const htmlBody = String(formData.get("htmlBody") ?? "");
    await createTemplateVersion({ templateId: params.templateId, subject, textBody, htmlBody: htmlBody || null });
  }

  async function onPublish(formData: FormData) {
    "use server";
    const versionId = String(formData.get("versionId") ?? "");
    await publishTemplateVersion({ templateId: params.templateId, versionId });
  }

  async function onArchive() {
    "use server";
    await archiveTemplate({ templateId: params.templateId });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{tpl.name}</h1>
          <p className="text-sm text-muted-foreground">{tpl.channel} • {tpl.status}</p>
        </div>
        <Link className="text-sm underline" href="/comms/templates">Back</Link>
      </div>

      <Tabs defaultValue="versions">
        <TabsList>
          <TabsTrigger value="versions">Versions</TabsTrigger>
          <TabsTrigger value="create">Create Version</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="danger">Danger</TabsTrigger>
        </TabsList>

        <TabsContent value="versions">
          <div className="space-y-3">
            {versions.map((v: any) => (
              <Card key={v.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">v{v.version_number}{tpl.active_version_id === v.id ? " • ACTIVE" : ""}</div>
                  <div className="text-xs text-muted-foreground">{new Date(v.created_at).toLocaleString()}</div>
                </div>
                {v.subject ? <div className="text-sm text-muted-foreground">Subject: {v.subject}</div> : null}
                <form action={onPublish} className="flex gap-2 items-center">
                  <input type="hidden" name="versionId" value={v.id} />
                  <Button type="submit" variant="secondary" disabled={tpl.active_version_id === v.id}>Publish</Button>
                </form>
                <div className="text-xs text-muted-foreground">Version ID: {v.id}</div>
              </Card>
            ))}
            {!versions.length && <div className="text-sm text-muted-foreground">No versions yet.</div>}
          </div>
        </TabsContent>

        <TabsContent value="create">
          <Card className="p-4 space-y-3">
            <form action={onCreateVersion} className="space-y-3">
              {tpl.channel === "email" ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Subject</div>
                  <Input name="subject" placeholder="Thanks for your order {{order.number}}" />
                </div>
              ) : null}

              <div className="space-y-1">
                <div className="text-sm font-medium">Text Body</div>
                <Textarea name="textBody" className="min-h-[140px]" placeholder="Hi {{contact.display_name}}..." required />
              </div>

              {tpl.channel === "email" ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">HTML Body (optional)</div>
                  <Textarea name="htmlBody" className="min-h-[140px]" placeholder="<p>Hi {{contact.display_name}}...</p>" />
                </div>
              ) : null}

              <Button type="submit">Create Version</Button>
            </form>
            <div className="text-xs text-muted-foreground">
              Versions are immutable. Publish to set template.active_version_id (rollback by publishing an older version).
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <TemplatePreviewTab templateId={params.templateId} versionId={previewMeta.versionId} placeholders={previewMeta.placeholders} channel={previewMeta.channel} />
        </TabsContent>

        <TabsContent value="danger">
          <Card className="p-4 space-y-3">
            <div className="text-sm text-muted-foreground">
              Templates are not hard-deleted. Archiving hides them from selection and stops publishing.
            </div>
            <form action={onArchive}>
              <Button type="submit" variant="destructive">Archive Template</Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
