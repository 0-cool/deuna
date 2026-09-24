"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  STAFF_ROLES,
  type MerchantSettingsExtras,
  type MerchantStaff,
  type StaffActivity,
  type StaffRole,
  type StaffStatus,
} from "@/lib/merchant-settings-storage";

const inputClass = "mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal";

const ROLE_TONE: Record<StaffRole, string> = {
  owner: "text-[#C49200]",
  admin: "text-[#3B6FCF]",
  employee: "text-teal",
  accounting: "text-[#7B5EA7]",
  readonly: "text-ink/45",
};

const AVATAR_TONE = ["bg-[#E8E4F8] text-[#5B4B8A]", "bg-[#FFE8D6] text-[#C46A1B]", "bg-[#E7F6EE] text-[#1F8A4C]", "bg-[#FFE4EF] text-[#C43B6F]", "bg-[#E8F1FF] text-[#3B6FCF]"];

export function MerchantUsersTab({
  extras,
  patch,
  inviteFocus,
  onGuide,
}: {
  extras: MerchantSettingsExtras;
  patch: (partial: Partial<MerchantSettingsExtras>) => void;
  inviteFocus: number;
  onGuide: () => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "">("");
  const [statusFilter, setStatusFilter] = useState<StaffStatus | "">("");
  const [invite, setInvite] = useState({ name: "", email: "", role: "" as StaffRole | "", message: "" });
  const [editing, setEditing] = useState<MerchantStaff | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [roleOpen, setRoleOpen] = useState<StaffRole | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inviteFocus) return;
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [inviteFocus]);

  const users = extras.teamUsers;
  const activity = extras.teamActivity;
  const total = users.length;
  const active = users.filter((user) => user.status === "active").length;
  const invited = users.filter((user) => user.status === "invited").length;
  const disabled = users.filter((user) => user.status === "disabled").length;

  const rows = useMemo(
    () =>
      users.filter((user) => {
        const hay = `${user.name} ${user.email}`.toLowerCase();
        if (query && !hay.includes(query.toLowerCase())) return false;
        if (roleFilter && user.role !== roleFilter) return false;
        if (statusFilter && user.status !== statusFilter) return false;
        return true;
      }),
    [users, query, roleFilter, statusFilter],
  );

  function setUsers(next: MerchantStaff[], extraActivity?: StaffActivity) {
    patch({
      teamUsers: next,
      teamActivity: extraActivity ? [extraActivity, ...activity].slice(0, 8) : activity,
    });
  }

  function inviteUser() {
    if (!invite.name.trim() || !invite.email.trim() || !invite.role) return;
    const staff: MerchantStaff = {
      id: `u-${Date.now()}`,
      name: invite.name.trim(),
      email: invite.email.trim(),
      role: invite.role,
      lastAccess: new Date().toISOString(),
      status: "invited",
    };
    setUsers(
      [...users, staff],
      { id: `a-${Date.now()}`, name: staff.name, action: "Invitación enviada", at: new Date().toISOString(), kind: "invite" },
    );
    setInvite({ name: "", email: "", role: "", message: "" });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon="users" value={total} label="Usuarios totales" delta={pct(total, 4)} />
        <Kpi icon="active" value={active} label="Usuarios activos" delta={pct(active, 3)} />
        <Kpi icon="clock" value={invited} label="Invitación pendiente" delta={pct(invited, 1)} />
        <Kpi icon="off" value={disabled} label="Usuario desactivado" delta={pct(disabled, 2)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-2">
            <label className="relative min-w-[12rem] flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar usuarios por nombre o correo..."
                className="w-full rounded-xl border border-ink/10 py-2 pl-8 pr-3 text-sm outline-none focus:border-teal"
              />
            </label>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as StaffRole | "")} className="rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <option value="">Todos los roles</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.id} value={role.id}>{role.label}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StaffStatus | "")} className="rounded-xl border border-ink/10 px-3 py-2 text-sm">
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="invited">Invitado</option>
              <option value="disabled">Desactivado</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                <tr>
                  <th className="pb-2 font-medium">Usuario</th>
                  <th className="pb-2 font-medium">Rol</th>
                  <th className="pb-2 font-medium">Último acceso</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/6">
                {rows.map((user, index) => {
                  const role = STAFF_ROLES.find((item) => item.id === user.role);
                  return (
                    <tr key={user.id}>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${AVATAR_TONE[index % AVATAR_TONE.length]}`}>
                            {initials(user.name)}
                          </span>
                          <div>
                            <p className="font-medium text-ink">{user.name}</p>
                            <p className="text-xs text-ink/40">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1.5 text-sm ${ROLE_TONE[user.role]}`}>
                          <RoleIcon role={user.role} />
                          {role?.label}
                        </span>
                      </td>
                      <td className="py-3 text-ink/55">{formatWhen(user.lastAccess)}</td>
                      <td className="py-3">
                        <StatusPill status={user.status} />
                      </td>
                      <td className="py-3">
                        <div className="relative flex items-center gap-2">
                          {user.status === "invited" ? (
                            <button
                              type="button"
                              onClick={() =>
                                setUsers(users, {
                                  id: `a-${Date.now()}`,
                                  name: user.name,
                                  action: "Invitación enviada",
                                  at: new Date().toISOString(),
                                  kind: "invite",
                                })
                              }
                              className="text-xs font-medium text-ink/50 hover:text-teal"
                            >
                              Reenviar
                            </button>
                          ) : user.status === "disabled" ? (
                            <button
                              type="button"
                              onClick={() =>
                                setUsers(
                                  users.map((item) => (item.id === user.id ? { ...item, status: "active" } : item)),
                                  { id: `a-${Date.now()}`, name: user.name, action: "Usuario activado", at: new Date().toISOString(), kind: "login" },
                                )
                              }
                              className="text-xs font-medium text-ink/50 hover:text-teal"
                            >
                              Activar
                            </button>
                          ) : (
                            <button type="button" onClick={() => setEditing(user)} className="text-xs font-medium text-ink/50 hover:text-teal">
                              Editar
                            </button>
                          )}
                          {user.role !== "owner" && (
                            <button type="button" onClick={() => setMenuId(menuId === user.id ? null : user.id)} className="px-1 text-ink/30 hover:text-ink" aria-label="Más">
                              ···
                            </button>
                          )}
                          {menuId === user.id && (
                            <div className="absolute right-0 top-7 z-10 w-40 rounded-xl border border-ink/8 bg-white p-1 shadow-lg">
                              {user.status !== "disabled" && (
                                <button
                                  type="button"
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#F6F5F2]"
                                  onClick={() => {
                                    setUsers(
                                      users.map((item) => (item.id === user.id ? { ...item, status: "disabled" } : item)),
                                      { id: `a-${Date.now()}`, name: user.name, action: "Usuario desactivado", at: new Date().toISOString(), kind: "disabled" },
                                    );
                                    setMenuId(null);
                                  }}
                                >
                                  Desactivar
                                </button>
                              )}
                              <button
                                type="button"
                                className="block w-full rounded-lg px-3 py-2 text-left text-xs text-coral hover:bg-[#FFF4F2]"
                                onClick={() => {
                                  setUsers(users.filter((item) => item.id !== user.id));
                                  setMenuId(null);
                                }}
                              >
                                Quitar del equipo
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Roles y permisos</h2>
          <p className="mt-1 text-xs text-ink/45">Define qué puede hacer cada tipo de usuario.</p>
          <ul className="mt-3 divide-y divide-ink/6">
            {STAFF_ROLES.map((role) => (
              <li key={role.id}>
                <button type="button" onClick={() => setRoleOpen(roleOpen === role.id ? null : role.id)} className="flex w-full items-start gap-3 py-3 text-left">
                  <span className={`mt-0.5 ${ROLE_TONE[role.id]}`}><RoleIcon role={role.id} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-ink">{role.label}</span>
                    <span className="block text-xs text-ink/40">{role.hint}</span>
                    {roleOpen === role.id && (
                      <span className="mt-2 block text-xs text-ink/55">
                        {role.id === "owner" && "Pedidos, catálogo, finanzas, usuarios y configuración."}
                        {role.id === "admin" && "Puede gestionar el día a día, sin cambiar al propietario."}
                        {role.id === "employee" && "Acepta pedidos y actualiza productos básicos."}
                        {role.id === "accounting" && "Ve reportes y comprobantes, sin editar el catálogo."}
                        {role.id === "readonly" && "Solo consulta pedidos, productos y analíticas."}
                      </span>
                    )}
                  </span>
                  <span className="text-ink/25">{roleOpen === role.id ? "–" : "+"}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section ref={formRef} className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Registrar nuevo usuario</h2>
          <p className="mt-1 text-xs text-ink/45">Invita a un miembro a tu equipo. La invitación queda en este dispositivo.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-ink/50">
              Nombre completo *
              <input value={invite.name} onChange={(event) => setInvite({ ...invite, name: event.target.value })} placeholder="Ej. Ana López" className={inputClass} />
            </label>
            <label className="text-xs text-ink/50">
              Correo electrónico *
              <input value={invite.email} onChange={(event) => setInvite({ ...invite, email: event.target.value })} placeholder="ejemplo@correo.com" className={inputClass} />
            </label>
            <label className="text-xs text-ink/50">
              Rol *
              <select value={invite.role} onChange={(event) => setInvite({ ...invite, role: event.target.value as StaffRole | "" })} className={inputClass}>
                <option value="">Selecciona un rol</option>
                {STAFF_ROLES.filter((role) => role.id !== "owner").map((role) => (
                  <option key={role.id} value={role.id}>{role.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="mt-3 block text-xs text-ink/50">
            Mensaje opcional
            <textarea
              value={invite.message}
              maxLength={300}
              onChange={(event) => setInvite({ ...invite, message: event.target.value })}
              placeholder="Personaliza el mensaje de invitación..."
              rows={3}
              className={inputClass}
            />
            <span className="mt-1 block text-right text-[11px] text-ink/35">{invite.message.length}/300</span>
          </label>
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={inviteUser} className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark">
              Enviar invitación
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <h2 className="font-medium text-ink">Actividad reciente de usuarios</h2>
          <ul className="mt-3 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F5F2] text-ink/40">
                  <ActivityIcon kind={item.kind} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">{item.name}</p>
                  <p className="text-xs text-ink/40">{item.action}</p>
                </div>
                <p className="shrink-0 text-[11px] text-ink/35">{formatWhen(item.at)}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="max-w-xs rounded-2xl bg-[#FFF4F2] p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-coral shadow-sm">
          <RoleIcon role="employee" />
        </div>
        <p className="font-display text-lg text-ink">Gestiona tu equipo</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Agrega usuarios y asigna permisos para que tu tienda opere de forma segura.
        </p>
        <button type="button" onClick={onGuide} className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark">
          Ver guía
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="font-display text-xl text-ink">Editar usuario</h3>
            <label className="mt-3 block text-xs text-ink/50">
              Nombre
              <input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} className={inputClass} />
            </label>
            <label className="mt-3 block text-xs text-ink/50">
              Correo
              <input value={editing.email} readOnly className={`${inputClass} bg-[#F6F5F2]`} />
            </label>
            {editing.role !== "owner" && (
              <label className="mt-3 block text-xs text-ink/50">
                Rol
                <select value={editing.role} onChange={(event) => setEditing({ ...editing, role: event.target.value as StaffRole })} className={inputClass}>
                  {STAFF_ROLES.filter((role) => role.id !== "owner").map((role) => (
                    <option key={role.id} value={role.id}>{role.label}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-medium">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsers(
                    users.map((item) => (item.id === editing.id ? editing : item)),
                    { id: `a-${Date.now()}`, name: editing.name, action: "Actualizó permisos", at: new Date().toISOString(), kind: "permissions" },
                  );
                  setEditing(null);
                }}
                className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ icon, value, label, delta }: { icon: "users" | "active" | "clock" | "off"; value: number; label: string; delta: string }) {
  const positive = delta.startsWith("+") || delta === "0%";
  return (
    <div className="rounded-2xl border border-ink/8 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F5F2] text-ink/40">
            <KpiIcon name={icon} />
          </span>
          <div>
            <p className="font-display text-2xl text-ink">{value}</p>
            <p className="text-xs text-ink/45">{label}</p>
          </div>
        </div>
        <p className={`text-[11px] ${positive ? "text-teal" : "text-coral"}`}>
          {delta}
          <span className="block text-ink/35">vs. anterior</span>
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: StaffStatus }) {
  if (status === "active") return <span className="inline-flex items-center gap-1 text-xs font-medium text-teal"><span className="h-1.5 w-1.5 rounded-full bg-teal" />Activo</span>;
  if (status === "invited") return <span className="inline-flex items-center gap-1 text-xs font-medium text-gold"><span className="h-1.5 w-1.5 rounded-full bg-gold" />Invitado</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-coral"><span className="h-1.5 w-1.5 rounded-full bg-coral" />Desactivado</span>;
}

function pct(current: number, previous: number) {
  if (!previous) return current ? "+100%" : "0%";
  const value = Math.round(((current - previous) / previous) * 100);
  return `${value > 0 ? "+" : ""}${value}%`;
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "") || "U").toUpperCase();
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const time = date.toLocaleTimeString("es-DO", { hour: "numeric", minute: "2-digit" });
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = (startToday - startThat) / 864e5;
  if (diff === 0) return `Hoy, ${time}`;
  if (diff === 1) return `Ayer, ${time}`;
  return `${date.toLocaleDateString("es-DO", { day: "numeric", month: "short", year: "numeric" })}, ${time}`;
}

function RoleIcon({ role }: { role: StaffRole }) {
  const className = "h-4 w-4";
  if (role === "owner") {
    return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 9 4 2 5-6 5 6 4-2v10H3z" /></svg>;
  }
  if (role === "admin") {
    return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5 6v6c0 5 3.2 7.8 7 9 3.8-1.2 7-4 7-9V6z" /></svg>;
  }
  if (role === "accounting") {
    return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>;
  }
  if (role === "readonly") {
    return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" /></svg>;
  }
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
}

function KpiIcon({ name }: { name: "users" | "active" | "clock" | "off" }) {
  const className = "h-4 w-4";
  if (name === "active") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
  if (name === "clock") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>;
  if (name === "off") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 10-6M16 16l5 5M21 16l-5 5" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="8" r="2.5" /><circle cx="16" cy="9" r="2" /><path d="M4 18a5 5 0 0 1 10 0M14 18a4 4 0 0 1 6-3.5" /></svg>;
}

function ActivityIcon({ kind }: { kind: StaffActivity["kind"] }) {
  const className = "h-4 w-4";
  if (kind === "invite") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></svg>;
  if (kind === "disabled") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="m8 8 8 8" /></svg>;
  if (kind === "created" || kind === "permissions") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3" /><path d="M5 19a7 7 0 0 1 14 0" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v4M8 12a4 4 0 1 0 4-4" /><circle cx="12" cy="16" r="1" /></svg>;
}
