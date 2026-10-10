"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/admin/Notice";
import { fieldClass, labelClass } from "@/components/admin/formStyles";
import { sendJson } from "@/lib/admin/apiClient";
import { describeRowError } from "@/lib/admin/import/rowErrors";
import { validateIdentity } from "@/lib/admin/import/validateRow";

type Feedback = { tone: "success" | "error"; message: string } | null;

const EMPTY = { nom: "", prenom: "", email: "" };

/** Formulaire du responsable de classe. La classe n'est pas un champ : elle vient de sa session. */
export function AddStudentForm({ classe }: { classe: string }) {
  const [values, setValues] = useState(EMPTY);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const update = (field: keyof typeof EMPTY) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event: FormEvent) {
    event.preventDefault();
    // Règle n°8 : validation locale avant tout appel réseau.
    const [firstError] = validateIdentity(values);
    if (firstError) return setFeedback({ tone: "error", message: describeRowError(firstError) });

    setIsSending(true);
    setFeedback(null);
    try {
      const result = await sendJson("/api/classe/etudiants", "POST", values);
      if (result.ok) {
        setFeedback({ tone: "success", message: `${values.prenom} ${values.nom} a été ajouté·e à la classe ${classe}.` });
        setValues(EMPTY);
      } else {
        setFeedback({ tone: "error", message: result.error });
      }
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-md space-y-4">
      {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}
      <div>
        <label htmlFor="prenom" className={labelClass}>
          Prénom
        </label>
        <input id="prenom" required autoComplete="off" value={values.prenom} onChange={update("prenom")} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="nom" className={labelClass}>
          Nom
        </label>
        <input id="nom" required autoComplete="off" value={values.nom} onChange={update("nom")} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="email" className={labelClass}>
          Email (@esp.sn ou @gmail.com)
        </label>
        <input
          id="email"
          type="email"
          required
          inputMode="email"
          autoComplete="off"
          value={values.email}
          onChange={update("email")}
          className={fieldClass}
        />
      </div>
      <Button type="submit" disabled={isSending}>
        {isSending ? "Ajout en cours…" : "Ajouter à ma classe"}
      </Button>
    </form>
  );
}
