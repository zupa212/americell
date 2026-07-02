"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  sendContactMessage,
  initialContactState,
} from "@/app/actions/contact";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ContactForm() {
  const [state, action, pending] = useActionState(
    sendContactMessage,
    initialContactState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Surface a toast on each new result and reset the form once a message
  // has been accepted.
  useEffect(() => {
    if (state.ok) {
      toast.success("Το μήνυμά σου στάλθηκε! Θα σου απαντήσουμε σύντομα.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Στείλε μας μήνυμα
        </CardTitle>
        <CardDescription>
          Συμπλήρωσε τη φόρμα και θα επικοινωνήσουμε μαζί σου στο email που θα
          δώσεις.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Όνομα</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Το όνομά σου"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Μήνυμα</Label>
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={5}
              placeholder="Πώς μπορούμε να βοηθήσουμε;"
            />
          </div>

          {state.error ? (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="w-full rounded-full"
          >
            {pending ? "Αποστολή…" : "Αποστολή μηνύματος"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
