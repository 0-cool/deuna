import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink-border bg-ink-soft">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-paper/60">
        <div className="flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-display text-xl text-paper">DeUna</p>
            <p className="mt-1 max-w-xs">Tú pide. Nosotros resolvemos.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            <div>
              <p className="font-medium text-paper/80">Categorías</p>
              <ul className="mt-2 space-y-1">
                <li>Ron</li>
                <li>Whisky</li>
                <li>Cervezas</li>
                <li>Para fiestas</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-paper/80">DeUna</p>
              <ul className="mt-2 space-y-1">
                <li>Cómo funciona</li>
                <li>Ayuda</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-paper/80">Legal</p>
              <ul className="mt-2 space-y-1">
                <li>Venta solo a mayores de edad</li>
                <li>Términos</li>
                <li>Privacidad</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-paper/80">Login</p>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link href="/merchant/login" className="hover:text-teal-light hover:underline">
                    Tienda
                  </Link>
                </li>
                <li>
                  <Link href="/driver/login" className="hover:text-teal-light hover:underline">
                    Delivery
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <p className="mt-8 border-t border-ink-border pt-6 text-xs">
          © {new Date().getFullYear()} DeUna República Dominicana. Venta de alcohol, tabaco y
          vape sujeta a verificación de edad y a la legislación dominicana aplicable.
        </p>
      </div>
    </footer>
  );
}