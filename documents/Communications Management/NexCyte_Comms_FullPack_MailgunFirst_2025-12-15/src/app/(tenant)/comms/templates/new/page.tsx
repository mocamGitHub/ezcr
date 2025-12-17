import { createTemplate } from "../actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewTemplatePage() {
  async function onCreate(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "");
    const channel = String(formData.get("channel") ?? "email") as "email" | "sms";
    const created = await createTemplate({ name, channel });
    // redirect after create
    return created;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">New Template</h1>
        <Link className="text-sm underline" href="/comms/templates">Back</Link>
      </div>

      <Card className="p-4 space-y-3">
        <form action={onCreate} className="space-y-3">
          <div className="space-y-1">
            <div className="text-sm font-medium">Name</div>
            <Input name="name" placeholder="Order follow-up" required />
          </div>

          <div className="space-y-1">
            <div className="text-sm font-medium">Channel</div>
            <select name="channel" className="w-full border rounded-md h-10 px-3 bg-background">
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <Button type="submit">Create</Button>
        </form>

        <p className="text-xs text-muted-foreground">
          After creating, open the template to add a version and publish it.
        </p>
      </Card>
    </div>
  );
}
