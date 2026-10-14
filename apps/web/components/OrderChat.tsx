"use client";

import { useState } from "react";
import type { OrderChatMessage } from "@deuna/types";
import { appendOrderChat } from "@/lib/customer-storage";

const DRIVER_REPLIES = [
  "Voy en camino, te aviso al llegar.",
  "Estoy en la tienda recogiendo tu pedido.",
  "Dame 3 minutos, ya casi llego.",
  "Perfecto, gracias. Cualquier cambio me escribes.",
];

export function OrderChat({
  code,
  messages,
  disabled,
  onChange,
}: {
  code: string;
  messages: OrderChatMessage[];
  disabled?: boolean;
  onChange: (messages: OrderChatMessage[]) => void;
}) {
  const [text, setText] = useState("");

  function send() {
    const body = text.trim();
    if (!body || disabled) return;
    const customerMessage: OrderChatMessage = {
      id: `c-${Date.now()}`,
      from: "customer",
      text: body,
      at: new Date().toISOString(),
    };
    appendOrderChat(code, customerMessage);
    const next = [...messages, customerMessage];
    onChange(next);
    setText("");

    window.setTimeout(() => {
      const reply: OrderChatMessage = {
        id: `d-${Date.now()}`,
        from: "driver",
        text: DRIVER_REPLIES[next.length % DRIVER_REPLIES.length] ?? DRIVER_REPLIES[0]!,
        at: new Date().toISOString(),
      };
      appendOrderChat(code, reply);
      onChange([...next, reply]);
    }, 900);
  }

  return (
    <div className="rounded-card border border-ink-border bg-ink-soft p-4">
      <p className="font-medium text-paper">Chat con el delivery</p>
      <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-paper/50">Escribe para coordinar la entrega.</p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.from === "customer"
                ? "ml-8 rounded-lg bg-teal/20 px-3 py-2 text-sm text-paper"
                : "mr-8 rounded-lg bg-ink px-3 py-2 text-sm text-paper/80"
            }
          >
            <p className="text-[11px] uppercase tracking-wide text-paper/40">
              {message.from === "customer" ? "Tú" : "Delivery"}
            </p>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          disabled={disabled}
          placeholder={disabled ? "El chat se cierra al finalizar" : "Escribe un mensaje"}
          className="flex-1 rounded-lg border border-ink-border bg-ink px-3 py-2 text-sm text-paper outline-none focus:border-teal disabled:opacity-50"
        />
        <button
          type="button"
          onClick={send}
          disabled={disabled}
          className="rounded-lg bg-teal px-3 py-2 text-sm font-medium text-paper disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
