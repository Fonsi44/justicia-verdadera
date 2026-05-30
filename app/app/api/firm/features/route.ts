import { NextRequest, NextResponse } from "next/server";
import { getFirmId, handleUnauthorized } from "@/lib/auth/require-auth";
import {
  getFeatureFlags,
  setFeatureFlag,
  type FeatureFlagName,
} from "@/lib/services/feature-flags";
import { AppError, ValidationError } from "@/lib/errors";

const VALID_FLAGS: FeatureFlagName[] = [
  "rls",
  "calendarSync",
  "whatsapp",
  "firmaElectronica",
  "portalCliente",
  "aiJuridica",
  "exportSar",
];

export async function GET() {
  try {
    const firmId = await getFirmId();
    const flags = await getFeatureFlags(firmId);
    return NextResponse.json({ data: flags });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError)
      return NextResponse.json(error.toJSON(), { status: error.status });
    console.error(
      "Error fetching feature flags:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "Error al obtener flags" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const firmId = await getFirmId();
    const body = await req.json();

    if (!body.flag || typeof body.enabled !== "boolean") {
      throw new ValidationError("Se requieren flag (string) y enabled (boolean)");
    }

    if (!VALID_FLAGS.includes(body.flag)) {
      throw new ValidationError(`Flag inválida: ${body.flag}`);
    }

    const flags = await setFeatureFlag(firmId, body.flag as FeatureFlagName, body.enabled);
    return NextResponse.json({ data: flags });
  } catch (error) {
    const unauthorized = handleUnauthorized(error);
    if (unauthorized) return unauthorized;
    if (error instanceof AppError)
      return NextResponse.json(error.toJSON(), { status: error.status });
    console.error(
      "Error updating feature flag:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "Error al actualizar flag" }, { status: 500 });
  }
}
