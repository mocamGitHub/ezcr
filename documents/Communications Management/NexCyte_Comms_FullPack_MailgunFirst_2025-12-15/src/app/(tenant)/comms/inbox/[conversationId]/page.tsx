import { getConversationThread, listTemplateVersionsForChannel, sendReply } from "../actions";
import { ReplyComposer } from "../components/ReplyComposer";
import { Card } from "@/components/ui/card";

export default async function ConversationPage({ params }: { params: { conversationId: string } }) {
  const { conversation, messages } = await getConversationThread(params.conversationId);
  const templates = await listTemplateVersionsForChannel(conversation.channel);

  async function onSend({ templateVersionId, variables }: { templateVersionId: string; variables: any }) {
    "use server";
    await sendReply({
      conversationId: conversation.id,
      contactId: conversation.contact_id,
      channel: conversation.channel,
      templateVersionId,
      variables,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{conversation.subject ?? "Conversation"}</h1>
        <p className="text-sm text-muted-foreground">Channel: {conversation.channel}</p>
      </div>

      <div className="space-y-3">
        {messages.map((m: any) => (
          <Card key={m.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase text-muted-foreground">{m.direction}</div>
              <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()} • {m.status}</div>
            </div>
            {m.subject ? <div className="mt-2 font-medium">{m.subject}</div> : null}
            <div className="mt-2 whitespace-pre-wrap text-sm">{m.body_text}</div>
          </Card>
        ))}
      </div>

      <ReplyComposer
        conversationId={conversation.id}
        contactId={conversation.contact_id}
        channel={conversation.channel}
        templateVersions={templates}
        onSend={onSend}
      />
    </div>
  );
}
