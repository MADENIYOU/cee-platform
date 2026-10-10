"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { sendJson } from "@/lib/admin/apiClient";
import { ASSIGNABLE_ROLES, ROLE_LABELS } from "@/lib/admin/roles/roleRules";
import type { AppRole } from "@/types/session";

type Access = { roles: AppRole[]; isResponsableClasse: boolean };
type Feedback = { tone: "success" | "error"; message: string } | null;

/** Cases à cocher des droits d'un compte. Chaque enregistrement est tracé côté serveur. */
export function RoleEditor({
  userId,
  userName,
  initial,
  canBeResponsable,
}: {
  userId: string;
  userName: string;
  initial: Access;
  canBeResponsable: boolean;
}) {
  const [saved, setSaved] = useState<Access>(initial);
  const [draft, setDraft] = useState<Access>(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isDirty =
    draft.isResponsableClasse !== saved.isResponsableClasse ||
    ASSIGNABLE_ROLES.some((role) => draft.roles.includes(role) !== saved.roles.includes(role));

  const toggleRole = (role: AppRole) => {
    setFeedback(null);
    setDraft((current) => ({
      ...current,
      roles: current.roles.includes(role)
        ? current.roles.filter((existing) => existing !== role)
        : [...current.roles, role],
    }));
  };

  async function save() {
    setIsSaving(true);
    setFeedback(null);
    try {
      const result = await sendJson<Access>(`/api/admin/users/${userId}/roles`, "PATCH", draft);
      if (result.ok) {
        setSaved(result.data);
        setDraft(result.data);
        setFeedback({ tone: "success", message: "Enregistré." });
      } else {
        setDraft(saved);
        setFeedback({ tone: "error", message: result.error });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <fieldset disabled={isSaving} className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <legend className="sr-only">Droits de {userName}</legend>
      {ASSIGNABLE_ROLES.map((role) => (
        <label key={role} className="flex min-h-10 items-center gap-2">
          <input type="checkbox" checked={draft.roles.includes(role)} onChange={() => toggleRole(role)} />
          {ROLE_LABELS[role]}
        </label>
      ))}
      <label className="flex min-h-10 items-center gap-2">
        <input
          type="checkbox"
          checked={draft.isResponsableClasse}
          disabled={!canBeResponsable}
          onChange={() => {
            setFeedback(null);
            setDraft((current) => ({ ...current, isResponsableClasse: !current.isResponsableClasse }));
          }}
        />
        Responsable de classe
      </label>
      <Button type="button" variant="outline" disabled={!isDirty} onClick={save}>
        {isSaving ? "Enregistrement…" : "Enregistrer"}
      </Button>
      {feedback && (
        <span
          role={feedback.tone === "error" ? "alert" : "status"}
          className={feedback.tone === "error" ? "text-sm text-[var(--color-danger)]" : "text-sm"}
        >
          {feedback.message}
        </span>
      )}
    </fieldset>
  );
}
