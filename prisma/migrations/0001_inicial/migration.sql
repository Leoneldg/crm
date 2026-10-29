-- Tablas iniciales del CRM y las tres apps de hoy.

CREATE TYPE "Rol" AS ENUM ('ADMIN', 'EQUIPO');

CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "usuario" VARCHAR(60) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'EQUIPO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "usuarios_usuario_key" ON "usuarios"("usuario");

CREATE TABLE "contactos" (
    "id" UUID NOT NULL,
    "app" VARCHAR(60) NOT NULL,
    "fecha_contacto" DATE,
    "contacto_tipo" VARCHAR(20),
    "canal_digital" VARCHAR(40),
    "canal_fisico" VARCHAR(40),
    "nombre" VARCHAR(160) NOT NULL,
    "ci_tipo" VARCHAR(1),
    "ci" VARCHAR(12),
    "telefono" VARCHAR(20),
    "telefono2" VARCHAR(20),
    "correo" VARCHAR(160),
    "estado" VARCHAR(80),
    "municipio" VARCHAR(80),
    "parroquia" VARCHAR(80),
    "sector" VARCHAR(120),
    "comunidad" VARCHAR(120),
    "calle" VARCHAR(200),
    "punto_referencia" VARCHAR(300),
    "interesado" VARCHAR(20),
    "potencial" VARCHAR(20),
    "plan" VARCHAR(40),
    "promotor" VARCHAR(120),
    "vendedor" VARCHAR(120),
    "pedido" VARCHAR(5),
    "fecha_pedido" DATE,
    "monto" DECIMAL(12,2),
    "credito" VARCHAR(5),
    "cobranza" VARCHAR(20),
    "cuentas_pendientes" DECIMAL(12,2),
    "cuotas" DECIMAL(12,2),
    "olvido_clave" VARCHAR(5),
    "reclamo_tipo" VARCHAR(30),
    "reclamo" VARCHAR(500),
    "observaciones" TEXT,
    "cargado_por_id" UUID,
    "actualizado_por" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "contactos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "contactos_app_idx" ON "contactos"("app");
CREATE INDEX "contactos_ci_idx" ON "contactos"("ci");
CREATE INDEX "contactos_telefono_idx" ON "contactos"("telefono");
CREATE INDEX "contactos_created_at_idx" ON "contactos"("created_at");
ALTER TABLE "contactos" ADD CONSTRAINT "contactos_cargado_por_id_fkey"
    FOREIGN KEY ("cargado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "opciones" (
    "id" UUID NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "opciones_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "opciones_tipo_nombre_key" ON "opciones"("tipo", "nombre");

INSERT INTO "opciones" ("id", "tipo", "nombre") VALUES
    (gen_random_uuid(), 'APP', 'BodegApp'),
    (gen_random_uuid(), 'APP', 'Merk2'),
    (gen_random_uuid(), 'APP', 'Pregonero de la Suerte');
