import { MessageCircle } from "lucide-react";

import { TELEGRAM_URL } from "@/lib/features";

/**
 * Floating Telegram help bubble, fixed bottom-right on every page. Icon-only
 * circle on phones ("συνεφάκι" in the corner), pill with a label on wider
 * screens. Opens the public Telegram chat for support.
 */
export default function TelegramBubble() {
  return (
    <a
      href={TELEGRAM_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on Telegram"
      title="Chat with us on Telegram"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center gap-2 rounded-full bg-[#229ED9] text-white shadow-[0_12px_34px_-8px_rgba(34,158,217,0.8)] ring-1 ring-white/25 transition-all duration-300 hover:scale-105 hover:bg-[#1b8ec4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6 sm:h-auto sm:w-auto sm:px-5 sm:py-3.5"
    >
      <MessageCircle className="h-6 w-6 shrink-0 sm:h-5 sm:w-5" aria-hidden="true" />
      <span className="hidden text-sm font-semibold sm:inline">Need help?</span>
    </a>
  );
}
