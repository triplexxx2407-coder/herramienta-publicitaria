"use client";

import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { entrar } from "@/lib/fuente";
import { ORDEN_REDES, nombreRed } from "@/lib/redes";
import { Logo } from "./BarraSuperior";
import { CirculoRed } from "./IconoRed";

/** La puerta: sin usuario y contraseña no se ve nada. */
export function PantallaEntrar() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [verla, setVerla] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  async function mandar(ev: FormEvent) {
    ev.preventDefault();
    if (!correo.trim() || !contrasena) return;
    setEntrando(true);
    setError(await entrar(correo.trim(), contrasena));
    setEntrando(false);
  }

  return (
    <main className="fondo-entrada relative flex min-h-dvh flex-1 items-center justify-center overflow-hidden px-4 py-8 lg:px-10">
      {/* Manchas de color de fondo, como luces. */}
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#2563eb]/25 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 -bottom-48 h-[30rem] w-[30rem] rounded-full bg-[#47807f]/30 blur-3xl" />

      <div className="relative grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        {/* Lado izquierdo: qué es NEXORA (en el celular, sólo el logo). */}
        <section className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start [&_a]:pointer-events-none">
            <Logo />
          </div>
          <h1 className="mt-6 hidden text-[40px] leading-[1.1] font-black text-white lg:block">
            Todos los mensajes de tus empresas, <span className="text-[#5eead4]">en un solo lugar.</span>
          </h1>
          <p className="mt-4 hidden max-w-md text-[16px] leading-relaxed text-tinta-2 lg:block">
            Lo que les escriben por Instagram, WhatsApp, Facebook, TikTok y correo llega aquí. Contestas desde NEXORA y le llega
            por la misma red.
          </p>
          <ul className="mt-6 hidden gap-2.5 lg:flex" aria-label="Redes">
            {ORDEN_REDES.map((r) => (
              <li key={r} title={nombreRed(r)}>
                <CirculoRed red={r} />
              </li>
            ))}
          </ul>
        </section>

        {/* Lado derecho: el formulario. */}
        <form
          onSubmit={mandar}
          className="mx-auto w-full max-w-[400px] rounded-[14px] border border-white/10 bg-[#13213d]/90 p-6 shadow-[0_24px_60px_rgb(0_0_0/0.45)] backdrop-blur-md sm:p-8"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] text-marca-400">
            <LockKeyhole size={22} aria-hidden />
          </span>
          <h2 className="mt-4 text-[24px] font-bold text-white">Bienvenido</h2>
          <p className="mt-1 text-[14.5px] text-tinta-2">Entra con el usuario y la contraseña que te dio el equipo.</p>

          <label className="mt-6 block text-[13px] font-semibold text-tinta-2" htmlFor="entrar-correo">
            Usuario
          </label>
          <div className="relative mt-1.5">
            <UserRound size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8095aa]" />
            <input
              id="entrar-correo"
              type="text"
              inputMode="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu usuario"
              className="h-12 w-full rounded-[8px] border border-white/10 bg-[#0d1a31] pr-3 pl-11 text-[16px] text-white outline-none placeholder:text-[#5f7189] focus:border-marca-400 focus:ring-2 focus:ring-marca-400/30"
            />
          </div>

          <label className="mt-4 block text-[13px] font-semibold text-tinta-2" htmlFor="entrar-contrasena">
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <LockKeyhole size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[#8095aa]" />
            <input
              id="entrar-contrasena"
              type={verla ? "text" : "password"}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="tu contraseña"
              className="h-12 w-full rounded-[8px] border border-white/10 bg-[#0d1a31] pr-12 pl-11 text-[16px] text-white outline-none placeholder:text-[#5f7189] focus:border-marca-400 focus:ring-2 focus:ring-marca-400/30"
            />
            <button
              type="button"
              onClick={() => setVerla((v) => !v)}
              aria-label={verla ? "Ocultar la contraseña" : "Ver la contraseña"}
              aria-pressed={verla}
              className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#9fb0c2] hover:bg-white/10 hover:text-white"
            >
              {verla ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-3 rounded-[8px] bg-[#7f1d1d]/40 px-3 py-2 text-[14px] font-semibold text-[#fecaca]">
              {error.charAt(0).toUpperCase() + error.slice(1)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={entrando || !correo.trim() || !contrasena}
            className="mt-6 h-12 w-full rounded-[8px] bg-linear-to-r from-[#2563eb] to-[#1d9e8f] text-[16px] font-bold text-white shadow-[0_8px_24px_rgb(37_99_235/0.35)] transition-[filter] hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
          >
            {entrando ? "Entrando…" : "Entrar"}
          </button>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-[#8095aa]">
            <ShieldCheck size={14} aria-hidden /> Sólo entra el equipo. Las cuentas las da el dueño.
          </p>
        </form>
      </div>
    </main>
  );
}
