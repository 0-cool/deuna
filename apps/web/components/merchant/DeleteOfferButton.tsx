"use client";

// Server Action pasada como prop desde un Server Component — necesitamos un componente cliente
// solo para el confirm() nativo antes de enviar el form; la mutación real sigue viviendo en
// app/merchant/actions.ts.
export function DeleteOfferButton({
  offerId,
  productName,
  action,
}: {
  offerId: string;
  productName: string;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Eliminar "${productName}" de tu catálogo? Si tiene pedidos previos, en vez de borrarlo lo desactivamos para conservar el historial.`,
        );
        if (!confirmed) event.preventDefault();
      }}
    >
      <input type="hidden" name="offerId" value={offerId} />
      <button
        type="submit"
        className="text-xs font-medium text-coral/80 transition hover:text-coral"
      >
        Eliminar
      </button>
    </form>
  );
}
