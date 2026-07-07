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
      toast.success("Your message has been sent! We’ll get back to you soon.");
      formRef.current?.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Send us a message
        </CardTitle>
        <CardDescription>
          Fill out the form and we’ll reach out to you at the email you provide.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form ref={formRef} action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              autoComplete="name"
              placeholder="Your name"
              className="h-11 sm:h-8"
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
              className="h-11 sm:h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              required
              minLength={10}
              rows={5}
              placeholder="How can we help?"
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
            className="h-11 w-full rounded-full sm:h-9"
          >
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
