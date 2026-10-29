# CRM del equipo

Los clientes de todas las apps (BodegApp, Merk2, Pregonero de la Suerte y las que vengan), cargados por el equipo. Reemplaza la planilla «CRM 2.xlsx»: tiene las mismas columnas, pero casi todo se elige con un toque y la descarga a Excel sale con el formato de la planilla.

Es un proyecto aparte de BodegApp. Tiene su propia base Postgres y sus propios usuarios, y no comparte nada con las otras apps.

## Qué hace

- **Cargar**: la app y el canal se eligen con un toque. La ubicación se elige en listas encadenadas (estado → municipio → parroquia). Después de guardar quedan puestos la app, el canal, la zona y el equipo, así que para el siguiente cliente solo se escribe nombre, cédula y teléfono. Avisa si ya existe un cliente con esa cédula o ese teléfono, en cualquier app.
- **Registros**: búsqueda, filtro por app, corrección de cualquier cliente y descarga en Excel.
- **Usuarios**: cada persona entra con su propio usuario. Se guarda quién cargó cada cliente.

| Rol | Puede |
|---|---|
| Equipo | Cargar y corregir clientes. Agregar apps y compañeros a las listas. |
| Administrador | Lo mismo, y además borrar clientes y manejar usuarios. |

## Ponerlo en el servidor

Hace falta Docker con Compose. Puede ir en el mismo servidor de BodegApp: usa otro puerto y otra base.

1. Copia el proyecto al servidor y entra a la carpeta.
2. Crea el `.env` a partir del ejemplo y cambia los valores:
   ```bash
   cp .env.example .env
   openssl rand -base64 48   # pégalo en SESSION_SECRET
   ```
3. Levántalo. Al arrancar, la app crea las tablas sola.
   ```bash
   docker compose up -d --build
   ```
4. Crea el primer administrador:
   ```bash
   docker compose exec app node scripts/crear-admin.mjs leonel "Leonel Ferrer" una-clave-larga
   ```
5. Entra a `http://<servidor>:3100`, ve a **Usuarios** y crea los del equipo.

**HTTPS:** pon el CRM detrás del mismo proxy que usan las otras apps (nginx, Caddy…) con un dominio, por ejemplo `crm.tudominio.com` → `localhost:3100`. Mientras se prueba por IP y sin HTTPS, agrega `COOKIE_INSEGURA=1` al `.env`. Sin eso el navegador no guarda la sesión. Quítalo apenas tenga HTTPS.

**Actualizar** después de un cambio:
```bash
git pull
docker compose up -d --build
```

**Respaldo de la base:**
```bash
docker compose exec -T db pg_dump -U crm crm > respaldo-crm-$(date +%F).sql
```

## Desarrollo

Hace falta Node 20 y un Postgres.

```bash
npm install
cp .env.example .env      # y descomenta DATABASE_URL
npx prisma migrate deploy
npm run crear-admin -- admin "Admin" una-clave-larga
npm run dev
```

Antes de subir un cambio: `npm run lint`, `npm run typecheck` y `npm test`. El CI de GitHub corre lo mismo, más el build.

**Cambiar opciones.** Las listas fijas (canales, potencial, planes, cobranza, reclamos) están en `src/lib/crm.ts`. Las columnas del Excel también. Las apps y la gente del equipo se agregan desde la pantalla.

**Cambiar tablas.** Edita `prisma/schema.prisma` y crea la migración con `npx prisma migrate dev --name que-cambia`. En el servidor se aplica sola al reiniciar.
