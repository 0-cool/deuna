import Link from "next/link";
import { LocationSelector } from "./LocationSelector";
import { SearchBar } from "./SearchBar";
import { CartBadge } from "./CartBadge";
import { AccountMenu } from "./AccountMenu";
import { getCurrentZoneLabel } from "@/lib/data";

export async function Header() {
  const zoneLabel = await getCurrentZoneLabel();

  return (
    <header className="sticky top-0 z-30 border-b border-ink-border bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:gap-6 lg:px-8 lg:py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl tracking-tight text-paper">
            De<span className="text-teal">Una</span>
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <LocationSelector currentZoneName={zoneLabel} />
            <AccountMenu />
            <CartBadge />
          </div>
        </div>

        <div className="hidden lg:block">
          <LocationSelector currentZoneName={zoneLabel} />
        </div>

        <div className="hidden min-w-0 flex-1 lg:block">
          <SearchBar />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <AccountMenu />
          <CartBadge />
        </div>
      </div>
      <div className="px-4 pb-3 lg:hidden">
        <SearchBar />
      </div>
    </header>
  );
}
