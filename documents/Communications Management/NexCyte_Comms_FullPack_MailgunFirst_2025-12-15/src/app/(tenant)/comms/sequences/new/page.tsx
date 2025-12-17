import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SequenceStepBuilder } from "../components/SequenceStepBuilder";
import { createSequence, listTemplateVersionsForBuilder } from "../actions";

export default async function NewSequencePage() {
  const options = await listTemplateVersionsForBuilder();

  async function onCreate(formData: FormData) {
    "use server";
    const name = String(formData.get("name") ?? "");
    const stepsJson = String(formData.get("steps_json") ?? "[]");
    const steps = JSON.parse(stepsJson || "[]");
    await createSequence({ name, steps });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">New Sequence</h1>
        <Link className="text-sm underline" href="/comms/sequences">Back</Link>
      </div>

      <Card className="p-4 space-y-4">
        <form action={onCreate} className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">Name</div>
            <Input name="name" placeholder="Post-purchase follow-up" required />
          </div>

          <input type="hidden" name="steps_json" id="steps_json" value="[]" />

          <SequenceStepsClient options={options} />

          <Button type="submit">Create Sequence</Button>
        </form>
      </Card>
    </div>
  );
}

function SequenceStepsClient({ options }: { options: any[] }) {
  "use client";
  const [stepsJson, setStepsJson] = React.useState("[]");

  React.useEffect(() => {
    const el = document.getElementById("steps_json") as HTMLInputElement | null;
    if (el) el.value = stepsJson;
  }, [stepsJson]);

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">Steps</div>
      <SequenceStepBuilder
        templateVersions={options}
        onChange={(steps) => setStepsJson(JSON.stringify(steps.map((s) => ({ delayMinutes: s.delayMinutes, templateVersionId: s.templateVersionId }))))}
      />
    </div>
  );
}

import React from "react";
