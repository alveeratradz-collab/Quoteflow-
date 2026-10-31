"use client";

import { useActionState } from "react";
import { Check, Sparkles } from "lucide-react";
import { changePlanAction } from "@/app/actions/billing";
import type { FormState } from "@/lib/validation";
import { Alert } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

const initial: FormState = {};

export function PlanForm({
  planId,
  currentPlan,
  label,
}: {
  planId: string;
  currentPlan: string;
  label: string;
}) {
  const [state, formAction] = useActionState(changePlanAction, initial);
  const isCurrent = currentPlan === planId;

  return (
    <form action={formAction} className="mt-4">
      <input type="hidden" name="plan" value={planId} />
      {state.error ? <div className="mb-2"><Alert tone="error">{state.error}</Alert></div> : null}
      {state.message ? <div className="mb-2"><Alert tone="success">{state.message}</Alert></div> : null}
      <SubmitButton
        className={`${isCurrent ? "btn-secondary" : planId === "free" ? "btn-secondary" : "btn-primary"} w-full`}
        pendingLabel="Updating…"
        disabled={isCurrent}
      >
        {isCurrent ? (
          <>
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Current plan
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden="true" /> {label}
          </>
        )}
      </SubmitButton>
    </form>
  );
}
