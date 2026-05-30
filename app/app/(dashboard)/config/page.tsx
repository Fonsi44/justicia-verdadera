import PageHeader from "@/components/page-header";
import Link from "next/link";

const sectionClass = "rounded-xl border bg-card ring-1 ring-foreground/10 p-6 space-y-4";

const fieldLabel = "text-sm font-medium text-foreground";
const fieldValue = "text-sm text-muted-foreground";

export default function ConfigPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Administra los ajustes de tu despacho"
      />

      {/* Información del Despacho */}
      <div className={sectionClass}>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Información del Despacho
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className={fieldLabel}>Nombre</p>
            <p className={fieldValue}>Justicia Verdadera</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Plan</p>
            <p className={fieldValue}>Starter</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Correo electrónico</p>
            <p className={fieldValue}>——</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Miembros</p>
            <p className={fieldValue}>1 de 1 usuarios</p>
          </div>
        </div>
      </div>

      {/* Suscripción */}
      <div className={sectionClass}>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Suscripción
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className={fieldLabel}>Plan actual</p>
            <p className={fieldValue}>Starter (750 L/mes)</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Estado</p>
            <p className="text-sm font-medium text-emerald-600">Activo</p>
          </div>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/80"
          >
            Ver planes
          </Link>
        </div>
      </div>

      {/* Preferencias */}
      <div className={sectionClass}>
        <h2 className="font-display text-lg font-semibold text-foreground">
          Preferencias
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className={fieldLabel}>Idioma</p>
            <p className={fieldValue}>Español</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Moneda</p>
            <p className={fieldValue}>HNL (Lempiras)</p>
          </div>
          <div className="space-y-1">
            <p className={fieldLabel}>Zona horaria</p>
            <p className={fieldValue}>America/Tegucigalpa</p>
          </div>
        </div>
      </div>
    </div>
  );
}
