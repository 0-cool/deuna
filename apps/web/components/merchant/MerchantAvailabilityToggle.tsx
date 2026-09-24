import { toggleOfferAvailabilityAction } from "@/app/merchant/actions";

export function MerchantAvailabilityToggle({
  offerId,
  isAvailable,
}: {
  offerId: string;
  isAvailable: boolean;
}) {
  return (
    <form action={toggleOfferAvailabilityAction}>
      <input type="hidden" name="offerId" value={offerId} />
      <input type="hidden" name="next" value={isAvailable ? "0" : "1"} />
      <button
        type="submit"
        aria-label={isAvailable ? "Pausar producto" : "Activar producto"}
        className={
          isAvailable
            ? "relative h-6 w-10 rounded-full bg-coral transition"
            : "relative h-6 w-10 rounded-full bg-ink/15 transition"
        }
      >
        <span
          className={
            isAvailable
              ? "absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition"
              : "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition"
          }
        />
      </button>
    </form>
  );
}
