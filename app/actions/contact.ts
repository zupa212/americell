"use server";

import * as z from "zod";

/**
 * State returned by {@link sendContactMessage}. Consumed on the client via
 * `useActionState`, so it must be serializable and stable across renders.
 *
 * - `ok`   : `true` once a valid message has been accepted, `false` otherwise.
 * - `error`: a Greek, user-facing validation/error message, or `null`.
 */
export type ContactState = {
  ok: boolean;
  error: string | null;
};

/** Idle/initial state for `useActionState`. */
export const initialContactState: ContactState = { ok: false, error: null };

const ContactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Δώσε το όνομά σου (τουλάχιστον 2 χαρακτήρες)."),
  email: z.email("Δώσε ένα έγκυρο email."),
  message: z
    .string()
    .trim()
    .min(10, "Το μήνυμα πρέπει να έχει τουλάχιστον 10 χαρακτήρες.")
    .max(5000, "Το μήνυμα είναι πολύ μεγάλο (μέχρι 5000 χαρακτήρες)."),
});

/**
 * Server action for the contact form. Validates the submitted fields with zod
 * and returns a `ContactState`. This is currently a STUB: no message is
 * actually delivered anywhere — it only validates the input and reports back.
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message;
    return {
      ok: false,
      error: first ?? "Έλεγξε τα στοιχεία που συμπλήρωσες και δοκίμασε ξανά.",
    };
  }

  // TODO: wire an email provider (e.g. Resend) — send `parsed.data` to the
  // team inbox and/or persist the message. Until then we simply acknowledge
  // the submission so the form can be exercised end-to-end.

  return { ok: true, error: null };
}
