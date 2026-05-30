import { NextRequest, NextResponse } from "next/server";
import { searchHelp } from "@/lib/help-content";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") || "";
  const results = searchHelp(query);
  return NextResponse.json({ data: results });
}
