"use client";

import { ChevronDown, LogOut, User } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * DashboardUserMenu — account dropdown for the dashboard header.
 *
 * Shows the signed-in email and exposes "Αποσύνδεση" via a shadcn
 * DropdownMenu. The sign-out item submits the `logout` server action
 * through a real <form>, so the flow keeps working without JS.
 */
export default function DashboardUserMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            aria-label="Μενού λογαριασμού"
          />
        }
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="hidden max-w-[16ch] truncate sm:inline">{email}</span>
        <ChevronDown className="h-4 w-4 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form action={logout}>
          <DropdownMenuItem
            variant="destructive"
            closeOnClick={false}
            render={
              <button type="submit" className="w-full cursor-pointer" />
            }
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Αποσύνδεση
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
