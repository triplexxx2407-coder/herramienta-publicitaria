"use client";

import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { entrar } from "@/lib/fuente";
import { Logo } from "./BarraSuperior";

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
    <main className="flex min-h-dvh flex-1 items-center justify-center bg-fondo px-4 py-8">
      <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <section className="text-center lg:text-left">
          <div className="flex justify-center lg:justify-start [&_a]:pointer-events-none">
            <Logo />
          </div>
          <h1 className="mt-6 hidden text-[38px] leading-[1.1] font-extrabold text-tinta lg:block">
            Mira qué videos y anuncios <span className="text-marca-600">sí traen clientes.</span>
          </h1>
          <p className="mt-4 hidden max-w-md text-[16px] leading-relaxed text-suave lg:block">
            Vistas, clics, likes, gente que toca tu enlace y quién te escribe por WhatsApp, empresa por empresa.
          </p>
        </section>

        {/* Lado derecho: el formulario. */}
        <form
          onSubmit={mandar}
          className="mx-auto w-full max-w-[400px] rounded-2xl border border-linea bg-white p-6 shadow-tarjeta sm:p-8"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marca-50 text-marca-600">
            <LockKeyhole size={22} aria-hidden />
          </span>
          <h2 className="mt-4 text-[24px] font-bold text-tinta">Bienvenido</h2>
          <p className="mt-1 text-[14.5px] text-suave">Entra con el usuario y la contraseña que te dio el equipo.</p>

          <label className="mt-6 block text-[13px] font-semibold text-tinta-2" htmlFor="entrar-correo">
            Usuario
          </label>
          <div className="relative mt-1.5">
            <UserRound size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tenue" />
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
              className="h-12 w-full rounded-lg border border-linea bg-white pr-3 pl-11 text-[16px] text-tinta outline-none placeholder:text-tenue focus:border-marca-500 focus:ring-2 focus:ring-marca-500/25"
            />
          </div>

          <label className="mt-4 block text-[13px] font-semibold text-tinta-2" htmlFor="entrar-contrasena">
            Contraseña
          </label>
          <div className="relative mt-1.5">
            <LockKeyhole size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-tenue" />
            <input
              id="entrar-contrasena"
              type={verla ? "text" : "password"}
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="tu contraseña"
              className="h-12 w-full rounded-lg border border-linea bg-white pr-12 pl-11 text-[16px] text-tinta outline-none placeholder:text-tenue focus:border-marca-500 focus:ring-2 focus:ring-marca-500/25"
            />
            <button
              type="button"
              onClick={() => setVerla((v) => !v)}
              aria-label={verla ? "Ocultar la contraseña" : "Ver la contraseña"}
              aria-pressed={verla}
              className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-suave hover:bg-relleno hover:text-tinta"
            >
              {verla ? <EyeOff size={19} aria-hidden /> : <Eye size={19} aria-hidden />}
            </button>
          </div>

          {error ? (
            <p role="alert" className="mt-3 rounded-lg bg-[#fdecea] px-3 py-2 text-[14px] font-semibold text-[#b42318]">
              {error.charAt(0).toUpperCase() + error.slice(1)}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={entrando || !correo.trim() || !contrasena}
            className="mt-6 h-12 w-full rounded-lg bg-marca-600 text-[16px] font-bold text-white transition-colors hover:bg-marca-700 disabled:opacity-50"
          >
            {entrando ? "Entrando…" : "Entrar"}
          </button>

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12.5px] text-tenue">
            <ShieldCheck size={14} aria-hidden /> Sólo entra el equipo. Las cuentas las da el dueño.
          </p>
        </form>
      </div>
    </main>
  );
}
