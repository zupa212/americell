import {
  Bitcoin,
  CircleDollarSign,
  Coins,
  CreditCard,
  Loader2,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Per-provider branded icon tile for the crypto payment picker — each provider
 * gets its own recognizable mark + brand colour instead of one generic shield.
 */
const VISUAL: Record<string, { Icon: LucideIcon; tile: string }> = {
  nowpayments: { Icon: Coins, tile: "bg-cyan-500/15 text-cyan-600 ring-1 ring-cyan-500/20" },
  btcpay: { Icon: Bitcoin, tile: "bg-orange-500/15 text-orange-600 ring-1 ring-orange-500/20" },
  coinbase: { Icon: CircleDollarSign, tile: "bg-blue-600/15 text-blue-600 ring-1 ring-blue-600/20" },
  moonpay: { Icon: CreditCard, tile: "bg-violet-500/15 text-violet-600 ring-1 ring-violet-500/20" },
};

export function CryptoIcon({
  id,
  busy,
  className,
}: {
  id: string;
  busy?: boolean;
  className?: string;
}) {
  const v = VISUAL[id] ?? { Icon: ShieldCheck, tile: "bg-brand/15 text-brand" };
  const Icon = busy ? Loader2 : v.Icon;
  return (
    <span
      aria-hidden="true"
      className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", v.tile, className)}
    >
      <Icon className={cn("h-5 w-5", busy && "animate-spin")} />
    </span>
  );
}
