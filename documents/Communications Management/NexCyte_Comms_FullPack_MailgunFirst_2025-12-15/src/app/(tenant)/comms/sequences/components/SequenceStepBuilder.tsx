"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

export type StepDraft = {
  id: string;
  delayMinutes: number;
  templateVersionId: string;
};

export function SequenceStepBuilder(props: {
  templateVersions: Array<{ id: string; label: string; channel: string }>;
  onChange: (steps: StepDraft[]) => void;
}) {
  const [steps, setSteps] = useState<StepDraft[]>([
    { id: crypto.randomUUID(), delayMinutes: 0, templateVersionId: props.templateVersions[0]?.id ?? "" },
  ]);

  const options = useMemo(() => props.templateVersions, [props.templateVersions]);

  function update(next: StepDraft[]) {
    setSteps(next);
    props.onChange(next);
  }

  function addStep() {
    update([...steps, { id: crypto.randomUUID(), delayMinutes: 60, templateVersionId: options[0]?.id ?? "" }]);
  }

  function removeStep(id: string) {
    update(steps.filter((s) => s.id !== id));
  }

  function patch(id: string, p: Partial<StepDraft>) {
    update(steps.map((s) => (s.id === id ? { ...s, ...p } : s)));
  }

  return (
    <div className="space-y-3">
      {steps.map((s, idx) => (
        <Card key={s.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Step {idx + 1}</div>
            <Button variant="ghost" onClick={() => removeStep(s.id)} disabled={steps.length === 1}>
              Remove
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Delay (minutes after previous)</div>
              <Input type="number" min={0} value={s.delayMinutes} onChange={(e) => patch(s.id, { delayMinutes: Number(e.target.value) })} />
            </div>

            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Template version</div>
              <Select value={s.templateVersionId} onValueChange={(v) => patch(s.id, { templateVersionId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template version" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>
      ))}

      <Button onClick={addStep} variant="secondary">Add Step</Button>
    </div>
  );
}
