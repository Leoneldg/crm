import { describe, it, expect } from "vitest";
import { coincideConBusqueda, normalizar, planillaCrm, posiblesDuplicados, type CrmContacto } from "@/lib/crm";
import { ErrorDeDatos, datosDeContacto, opcionNueva, usuarioNuevo } from "@/lib/validacion";

const APPS = ["BodegApp", "Merk2", "Pregonero de la Suerte"];
const base = { app: "Merk2", nombre: "  María   Pérez ", telefono: "0412-1234567" };

function contacto(id: string, datos: Record<string, unknown>, createdAt = "2026-10-29T10:00:00.000Z"): CrmContacto {
  return { ...datosDeContacto({ ...base, ...datos }, APPS), id, cargadoPor: "Ana", createdAt, updatedAt: createdAt };
}

describe("datosDeContacto", () => {
  it("acepta lo mínimo y limpia los espacios del nombre", () => {
    const d = datosDeContacto(base, APPS);
    expect(d.nombre).toBe("María Pérez");
    expect(d.app).toBe("Merk2");
    expect(d.monto).toBeNull();
  });

  it("pide un teléfono o la cédula, y deja la cédula en números", () => {
    expect(() => datosDeContacto({ app: "Merk2", nombre: "María" }, APPS)).toThrow(ErrorDeDatos);
    const d = datosDeContacto({ app: "Merk2", nombre: "María", ci: "V-12.345.678" }, APPS);
    expect(d.ci).toBe("12345678");
    expect(d.ciTipo).toBe("V");
  });

  it("no acepta una app que no está en la lista", () => {
    expect(() => datosDeContacto({ ...base, app: "Otra" }, APPS)).toThrow(/no está en la lista/);
  });

  it("no acepta una opción inventada en las listas fijas", () => {
    expect(() => datosDeContacto({ ...base, potencial: "Altísimo" }, APPS)).toThrow(ErrorDeDatos);
  });

  it("descarta el canal del otro lado y el monto sin pedido", () => {
    const d = datosDeContacto({ ...base, contactoTipo: "Físico", canalDigital: "WhatsApp", canalFisico: "Referido", pedido: "No", monto: "25" }, APPS);
    expect(d.canalDigital).toBeNull();
    expect(d.canalFisico).toBe("Referido");
    expect(d.monto).toBeNull();
  });

  it("redondea el monto del pedido a centavos", () => {
    expect(datosDeContacto({ ...base, pedido: "Sí", fechaPedido: "2026-10-29", monto: "12.345" }, APPS).monto).toBe(12.35);
  });

  it("rechaza un correo mal escrito", () => {
    expect(() => datosDeContacto({ ...base, correo: "maria@" }, APPS)).toThrow(/correo/);
  });
});

describe("listas y usuarios", () => {
  it("valida el tipo de lista y limpia el nombre", () => {
    expect(opcionNueva({ tipo: "APP", nombre: " Nueva   App " })).toEqual({ tipo: "APP", nombre: "Nueva App" });
    expect(() => opcionNueva({ tipo: "OTRA", nombre: "X y Z" })).toThrow(ErrorDeDatos);
  });

  it("pasa el usuario a minúsculas y exige 8 caracteres de contraseña", () => {
    expect(usuarioNuevo({ nombre: "Ana Díaz", usuario: "Ana.Diaz", clave: "12345678" }).usuario).toBe("ana.diaz");
    expect(() => usuarioNuevo({ nombre: "Ana Díaz", usuario: "ana", clave: "corta" })).toThrow(/8 caracteres/);
    expect(() => usuarioNuevo({ nombre: "Ana Díaz", usuario: "ana díaz", clave: "12345678" })).toThrow(ErrorDeDatos);
  });
});

describe("posiblesDuplicados", () => {
  const a = contacto("a", { ci: "12345678" });
  const lista = [a, contacto("b", { telefono: "0414-7654321" })];

  it("encuentra por cédula o teléfono, sin importar el formato", () => {
    expect(posiblesDuplicados(lista, { ci: "12.345.678", telefono: null, telefono2: null })).toEqual([a]);
    expect(posiblesDuplicados(lista, { ci: null, telefono: "0412 123 4567", telefono2: null })).toContain(a);
  });

  it("no cuenta datos a medio escribir ni al mismo contacto", () => {
    expect(posiblesDuplicados(lista, { ci: "123", telefono: "0412", telefono2: null })).toEqual([]);
    expect(posiblesDuplicados([a], { ci: "12345678", telefono: null, telefono2: null }, "a")).toEqual([]);
  });
});

describe("planillaCrm", () => {
  it("arma las columnas del CRM con una X en el plan y fechas a la venezolana", () => {
    const [cabecera, fila] = planillaCrm([contacto("a", { plan: "Evolución", fechaContacto: "2026-10-29" })]);
    const col = (t: string) => cabecera!.indexOf(t);
    expect(fila![col("EMPRESA")]).toBe("Merk2");
    expect(fila![col("P. EVOLUCION")]).toBe("X");
    expect(fila![col("P. BASICO")]).toBe("");
    expect(fila![col("FECHA 1ER CONTACTO")]).toBe("29/10/2026");
    expect(fila![col("CARGADO POR")]).toBe("Ana");
  });

  it("ordena del más viejo al más nuevo y numera", () => {
    const filas = planillaCrm([contacto("b", { nombre: "Nuevo" }, "2026-10-29T12:00:00.000Z"), contacto("a", { nombre: "Viejo" }, "2026-10-28T12:00:00.000Z")]);
    expect(filas.slice(1).map((f) => [f[0], f[2]])).toEqual([
      [1, "Viejo"],
      [2, "Nuevo"],
    ]);
  });
});

describe("coincideConBusqueda", () => {
  const maria = contacto("m", {
    nombre: "María Pérez",
    ci: "12345678",
    telefono: "0412-6722979",
    estado: "Distrito Capital",
    municipio: "Libertador",
    parroquia: "El Valle",
    promotor: "Maria M",
    observaciones: "Nombre en WhatsApp: 🥰.",
  });

  it("sin búsqueda, muestra a todos", () => {
    expect(coincideConBusqueda(maria, "   ")).toBe(true);
  });

  it("cada palabra tiene que aparecer, sin importar acentos ni mayúsculas", () => {
    expect(coincideConBusqueda(maria, "maria valle")).toBe(true);
    expect(coincideConBusqueda(maria, "PEREZ")).toBe(true);
    expect(coincideConBusqueda(maria, "maria coche")).toBe(false);
  });

  it("encuentra el teléfono en cualquier formato, también como lo da WhatsApp", () => {
    for (const q of ["04126722979", "0412-672", "0412 672 2979", "584126722979", "2979"]) {
      expect(coincideConBusqueda(maria, q), q).toBe(true);
    }
    expect(coincideConBusqueda(maria, "0414")).toBe(false);
  });

  it("encuentra la cédula con o sin puntos, y con la letra adelante", () => {
    expect(coincideConBusqueda(maria, "12.345.678")).toBe(true);
    expect(coincideConBusqueda(maria, "V-12345678")).toBe(true);
    expect(coincideConBusqueda(maria, "v12345678")).toBe(true);
    expect(coincideConBusqueda(maria, "87654321")).toBe(false);
  });

  it("busca también en el promotor y en las observaciones", () => {
    expect(coincideConBusqueda(maria, "maria m")).toBe(true);
    expect(coincideConBusqueda(maria, "🥰")).toBe(true);
  });
});

describe("normalizar", () => {
  it("ignora acentos y mayúsculas", () => {
    expect(normalizar("  Pérez ÁLVAREZ ")).toBe("perez alvarez");
  });
});
