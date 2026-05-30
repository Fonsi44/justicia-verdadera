import { ForbiddenError } from "@/lib/errors";
import {
  isFeatureEnabled,
  type FeatureFlagName,
  FEATURE_FLAG_LABELS,
} from "@/lib/services/feature-flags";

export async function requireFeature(firmId: string, featureName: FeatureFlagName) {
  const enabled = await isFeatureEnabled(firmId, featureName);
  if (!enabled) {
    const label = FEATURE_FLAG_LABELS[featureName] ?? featureName;
    throw new ForbiddenError(
      `La funcionalidad "${label}" no está habilitada para tu despacho.`
    );
  }
}
