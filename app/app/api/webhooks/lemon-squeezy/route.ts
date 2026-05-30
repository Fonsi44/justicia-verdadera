import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const webhookSecret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-signature");

    const eventName = req.headers.get("x-event-name") ?? "unknown";
    const eventData = JSON.parse(body);

    console.log(`[Lemon Squeezy Webhook] Event: ${eventName}`);

    switch (eventName) {
      case "order_created":
      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled":
        console.log(`  Processing: ${eventName}`, JSON.stringify(eventData).substring(0, 200));
        break;
      default:
        console.log(`  Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Lemon Squeezy Webhook Error]", error);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
