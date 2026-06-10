import { AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, iconClassName }: { className?: string; iconClassName?: string }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg bg-gradient-amber text-background shrink-0",
        className,
      )}
    >
      <AudioWaveform className={cn("h-[55%] w-[55%]", iconClassName)} strokeWidth={2.5} />
    </div>
  );
}
