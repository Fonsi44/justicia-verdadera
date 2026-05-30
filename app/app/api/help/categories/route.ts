import { NextResponse } from "next/server";
import { HELP_CATEGORIES } from "@/lib/help-content";

export async function GET() {
  const categories = HELP_CATEGORIES.map(({ id, name, icon, articles }) => ({
    id,
    name,
    icon,
    articles,
  }));
  return NextResponse.json({ data: categories });
}
