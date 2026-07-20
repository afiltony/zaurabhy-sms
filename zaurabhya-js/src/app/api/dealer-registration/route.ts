import { NextResponse } from "next/server";
import { dealerRegistrationSchema } from "@/lib/validation";
import { appendLead } from "@/lib/leads";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = dealerRegistrationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await appendLead("dealer-registrations.jsonl", parsed.data);

  return NextResponse.json({ success: true });
}
