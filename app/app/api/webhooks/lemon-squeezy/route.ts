import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import { updateFirmSubscription, getVariantTier, getFirmBySubscriptionId } from "@/lib/services/subscription.service";

interface LSEventData {
  meta?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      custom_data?: any;
  };
  data?: {
    id?: string;
    attributes?: {
      first_order_item?: {
        variant_id?: number;
      };
      variant_id?: number;
      status?: string;
      ends_at?: string | null;
      product_id?: number;
    };
  };
}

function verifySignature(payload: string, signature: string | null): boolean {
  if (!signature || !process.env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    return false;
  }

  try {
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    const received = signature;

    if (expected.length !== received.length) {
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
  } catch {
    return false;
  }
}

function getFirmIdFromMeta(eventData: LSEventData): string | null {
  return eventData?.meta?.custom_data?.firm_id ?? eventData?.meta?.custom_data?.firmId ?? null;
}

async function processOrderCreated(eventData: LSEventData) {
  const firmId = getFirmIdFromMeta(eventData);
  if (!firmId) {
    console.warn("[Lemon Squeezy] order_created: no firm_id in custom_data");
    return;
  }

  const variantId = String(eventData?.data?.attributes?.first_order_item?.variant_id ?? "");
  const tier = getVariantTier(variantId);

  await updateFirmSubscription(firmId, {
    subscriptionStatus: "active",
    subscriptionTier: tier,
  });

  console.log(`[Lemon Squeezy] order_created: firm ${firmId} -> tier ${tier}`);
}

async function processSubscriptionCreated(eventData: LSEventData) {
  const firmId = getFirmIdFromMeta(eventData);
  if (!firmId) {
    console.warn("[Lemon Squeezy] subscription_created: no firm_id in custom_data");
    return;
  }

  const subId = String(eventData?.data?.id ?? "");
  const variantId = String(eventData?.data?.attributes?.variant_id ?? "");
  const tier = getVariantTier(variantId);

  const attributes = eventData?.data?.attributes;
  const endDateStr = attributes?.ends_at ?? null;

  await updateFirmSubscription(firmId, {
    subscriptionStatus: "active",
    subscriptionTier: tier,
    subscriptionId: subId,
    subscriptionEndDate: endDateStr ? new Date(endDateStr) : null,
  });

  console.log(`[Lemon Squeezy] subscription_created: firm ${firmId} -> tier ${tier}, sub ${subId}`);
}

async function processSubscriptionUpdated(eventData: LSEventData) {
  const subId = String(eventData?.data?.id ?? "");
  const firm = await getFirmBySubscriptionId(subId);

  if (!firm) {
    console.warn(`[Lemon Squeezy] subscription_updated: no firm found for sub ${subId}`);
    return;
  }

  const variantId = String(eventData?.data?.attributes?.variant_id ?? "");
  const tier = getVariantTier(variantId);
  const status = eventData?.data?.attributes?.status ?? "active";

  const statusMap: Record<string, string> = {
    active: "active",
    paused: "active",
    past_due: "past_due",
    cancelled: "cancelled",
    expired: "expired",
    trial: "trial",
  };

  await updateFirmSubscription(firm.id, {
    subscriptionStatus: statusMap[status] ?? "active",
    subscriptionTier: tier,
  });

  console.log(`[Lemon Squeezy] subscription_updated: firm ${firm.id} -> status ${status}, tier ${tier}`);
}

async function processSubscriptionCancelled(eventData: LSEventData) {
  const subId = String(eventData?.data?.id ?? "");
  const firm = await getFirmBySubscriptionId(subId);

  if (!firm) {
    console.warn(`[Lemon Squeezy] subscription_cancelled: no firm found for sub ${subId}`);
    return;
  }

  const endDateStr = eventData?.data?.attributes?.ends_at ?? null;

  await updateFirmSubscription(firm.id, {
    subscriptionStatus: "cancelled",
    subscriptionEndDate: endDateStr ? new Date(endDateStr) : null,
  });

  console.log(`[Lemon Squeezy] subscription_cancelled: firm ${firm.id} ends at ${endDateStr}`);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.text();
    const signature = req.headers.get("x-signature");

    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const eventName = req.headers.get("x-event-name") ?? "unknown";
    const eventData = JSON.parse(payload);

    console.log(`[Lemon Squeezy Webhook] Event: ${eventName}`);

    switch (eventName) {
      case "order_created":
        await processOrderCreated(eventData);
        break;
      case "subscription_created":
        await processSubscriptionCreated(eventData);
        break;
      case "subscription_updated":
        await processSubscriptionUpdated(eventData);
        break;
      case "subscription_cancelled":
        await processSubscriptionCancelled(eventData);
        break;
      default:
        console.log(`  Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Lemon Squeezy Webhook Error]", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
