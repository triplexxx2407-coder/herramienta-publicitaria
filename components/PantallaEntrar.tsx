"use client";

import { LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";
import { entrar } from "@/lib/fuente";

/** La puerta: sin usuario y contraseña no se ve nada. */
export function PantallaEntrar() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
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
    <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-10 sm:items-center sm:pt-0">
      <form onSubmit={mandar} className="w-full max-w-sm rounded-[6px] bg-panel p-6 shadow-flotante">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pildora text-marca-400">
          <LockKeyhole size={22} aria-hidden />
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">Entra a NEXORA</h1>
        <p className="mt-1 text-sm text-tinta-2">Sólo entra el equipo. Si no tienes cuenta, pídesela al dueño.</p>

        <label className="mt-5 block text-sm font-semibold text-tinta-2" htmlFor="entrar-correo">
          Usuario
        </label>
        <input
          id="entrar-correo"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-[4px] bg-pildora px-3 text-[16px] text-tinta outline-none focus:ring-2 focus:ring-marca-400"
        />

        <label className="mt-4 block text-sm font-semibold text-tinta-2" htmlFor="entrar-contrasena">
          Contraseña
        </label>
        <input
          id="entrar-contrasena"
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          className="mt-1.5 h-11 w-full rounded-[4px] bg-pildora px-3 text-[16px] text-tinta outline-none focus:ring-2 focus:ring-marca-400"
        />

        {error ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-[#fca5a5]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={entrando || !correo.trim() || !contrasena}
          className="mt-5 h-11 w-full rounded-[4px] bg-marca-600 text-[15px] font-bold text-white transition-colors hover:bg-marca-700 disabled:opacity-50"
        >
          {entrando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
