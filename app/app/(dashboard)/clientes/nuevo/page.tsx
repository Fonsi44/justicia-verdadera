"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// TODO: Migrate to react-hook-form + zod for consistency with casos/nuevo
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateContact } from "@/hooks/use-contacts";
import { toast } from "sonner";
import PageHeader from "@/components/page-header";

export default function NewContactPage() {
  const router = useRouter();
  const createContact = useCreateContact();
  const [type, setType] = useState("persona_natural");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const isNatural = type === "persona_natural";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({
        type,
        firstName: isNatural ? firstName || undefined : undefined,
        lastName: isNatural ? lastName || undefined : undefined,
        companyName: isNatural ? undefined : companyName || undefined,
        identityNumber: identityNumber || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        notes: notes || undefined,
      });
      toast.success("Contacto creado exitosamente");
      router.push("/clientes");
    } catch {
      toast.error("Error al crear el contacto");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeader
        title="Nuevo contacto"
        description="Agrega un cliente, contacto o institución"
        breadcrumbs={[
          { label: "Clientes", href: "/clientes" },
          { label: "Nuevo contacto" },
        ]}
      />

      <form onSubmit={handleSubmit} className="rounded-xl border bg-card shadow-sm p-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo de contacto</Label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="flex h-8 w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="persona_natural">Persona Natural</option>
            <option value="persona_juridica">Persona Jur&iacute;dica</option>
            <option value="institucion">Instituci&oacute;n</option>
          </select>
        </div>

        {isNatural ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nombre"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Apellido"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="companyName">
              {type === "persona_juridica" ? "Nombre de la empresa" : "Nombre de la instituci&oacute;n"}
            </Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Raz&oacute;n social"
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identityNumber">Identidad / RTN</Label>
            <Input
              id="identityNumber"
              value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              placeholder="0801-..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Tel&eacute;fono</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+504 9999-9999"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Direcci&oacute;n</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Direcci&oacute;n f&iacute;sica"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales..."
            rows={3}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={createContact.isPending}>
            {createContact.isPending ? "Guardando..." : "Guardar contacto"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
