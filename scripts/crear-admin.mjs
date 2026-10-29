// Crea el primer administrador (o le cambia la contraseña si ya existe).
//
//   docker compose exec app node scripts/crear-admin.mjs <usuario> "<Nombre y apellido>" <contraseña>
//
// Después, ese administrador crea al resto del equipo desde /usuarios.
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [usuarioCrudo, nombre, clave] = process.argv.slice(2);
const usuario = (usuarioCrudo ?? "").trim().toLowerCase();

if (!/^[a-z0-9._-]{3,40}$/.test(usuario) || !nombre || nombre.trim().length < 2 || !clave || clave.length < 8) {
  console.error('Uso: node scripts/crear-admin.mjs <usuario> "<Nombre y apellido>" <contraseña de 8 o más caracteres>');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const passwordHash = await bcrypt.hash(clave, 10);
  const u = await prisma.usuario.upsert({
    where: { usuario },
    create: { usuario, nombre: nombre.trim(), passwordHash, rol: "ADMIN" },
    update: { nombre: nombre.trim(), passwordHash, rol: "ADMIN", activo: true },
  });
  console.log(`Listo: ${u.usuario} es administrador del CRM.`);
} finally {
  await prisma.$disconnect();
}
