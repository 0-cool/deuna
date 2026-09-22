import Link from "next/link";
import { LocationSelector } from "./LocationSelector";
import { SearchBar } from "./SearchBar";
import { CartBadge } from "./CartBadge";
import { getCurrentZoneLabel } from "@/lib/data";

export async function Header() {
  const zoneLabel = await getCurrentZoneLabel();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-border bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl tracking-tight text-paper">
            De<span className="text-teal-light">Una</span>
          </Link>
          <div className="sm:hidden">
            <CartBadge />
          </div>
        </div>

        <div className="flex flex-1 items-center gap-3">
          <LocationSelector currentZoneName={zoneLabel} />
          <div className="hidden flex-1 sm:block">
            <SearchBar />
          </div>
        </div>

        <div className="hidden sm:block">
          <CartBadge />
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden">
        <SearchBar />
      </div>
    </header>
  );
}