"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, Download, Building2, CreditCard, Database } from "lucide-react";
import PageHeader from "@/components/page-header";

interface FirmData {
  name: string;
  slug: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxId: string | null;
  isvRate: string | null;
  createdAt: string;
  userCount: number;
}

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export default function ConfigPage() {
  const [firm, setFirm] = useState<FirmData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [isvRate, setIsvRate] = useState("15");

  useEffect(() => {
    fetch("/api/firm")
      .then((res) => res.json())
      .then((json) => {
        const d = json.data as FirmData;
        setFirm(d);
        setUser(json.user as UserData);
        setContactEmail(d.contactEmail ?? "");
        setContactPhone(d.contactPhone ?? "");
        setAddress(d.address ?? "");
        setTaxId(d.taxId ?? "");
        setIsvRate(d.isvRate ?? "15");
      })
      .catch(() => {
        toast.error("Error al cargar la configuración");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/firm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactEmail: contactEmail || null,
          contactPhone: contactPhone || null,
          address: address || null,
          taxId: taxId || null,
          isvRate: isvRate || "15",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al guardar");
      }
      const json = await res.json();
      setFirm((prev) => prev ? { ...prev, ...json.data } : null);
      toast.success("Cambios guardados exitosamente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Configuración" description="Administra los ajustes de tu despacho" />
        <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuración"
        description="Administra los ajustes de tu despacho"
      />

      {/* Información del Despacho */}
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              {firm?.name ?? "Despacho"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {user?.role === "owner" ? "Propietario" : user?.role === "admin" ? "Administrador" : "Abogado"}
              {" — "}
              {user?.email}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Correo de contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="despacho@ejemplo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Teléfono</Label>
              <Input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+504 2XXX-XXXX"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Dirección del despacho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">RTN</Label>
              <Input
                id="taxId"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                placeholder="RTN del despacho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isvRate">ISV (%)</Label>
              <Input
                id="isvRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={isvRate}
                onChange={(e) => setIsvRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Tasa de ISV predeterminada para facturación (default: 15%)
              </p>
            </div>
            <div className="space-y-2">
              <Label>Miembros activos</Label>
              <div className="flex h-8 items-center text-sm text-muted-foreground">
                {firm?.userCount ?? 0} usuario{(firm?.userCount ?? 0) !== 1 ? "s" : ""}
              </div>
            </div>
          </div>

          <div className="flex justify-end border-t pt-4">
            <Button type="submit" disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </div>

      {/* Suscripción */}
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <CreditCard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Suscripción
            </h2>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Plan actual</p>
            <p className="text-sm text-muted-foreground">Starter</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Estado</p>
            <Badge variant="default" className="bg-emerald-600/10 text-emerald-600 hover:bg-emerald-600/20 border-0">
              Activo
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Usuarios</p>
            <p className="text-sm text-muted-foreground">
              {firm?.userCount ?? 0} / 1
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Casos activos</p>
            <p className="text-sm text-muted-foreground">— / 20</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Almacenamiento</p>
            <p className="text-sm text-muted-foreground">— / 500 MB</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Prompts IA</p>
            <p className="text-sm text-muted-foreground">— / 10 por mes</p>
          </div>
        </div>
        <div className="border-t pt-4">
          <Button
            render={<Link href="/suscripcion" />}
            variant="outline"
            size="sm"
            className="gap-2"
            nativeButton={false}
          >
            Ver planes disponibles
          </Button>
        </div>
      </div>

      {/* Exportación */}
      <div className="rounded-xl border bg-card ring-1 ring-foreground/10 p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Exportación de datos
            </h2>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Exporta tus datos en formato JSON o CSV para respaldo o migración.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/api/backup/export?format=json"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-foreground"
            download
          >
            <Download className="h-4 w-4" />
            Exportar JSON
          </a>
          <a
            href="/api/backup/export?format=csv"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-all hover:bg-muted hover:text-foreground"
            download
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </a>
        </div>
      </div>
    </div>
  );
}
