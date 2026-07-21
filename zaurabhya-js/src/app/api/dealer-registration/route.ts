import { NextResponse } from "next/server";
import { dealerRegistrationSchema } from "@/lib/validation";
import { appendLead } from "@/lib/leads";
import { sendAutoReply, sendLeadNotification } from "@/lib/mail";

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
  await sendLeadNotification("New dealer registration", parsed.data);
  await sendAutoReply(
    parsed.data.email,
    parsed.data.fullName,
    "Thank you for registering as a ZAURABHYA dealer. Our partnerships team will review your details and reach out shortly.",
  );

  return NextResponse.json({ success: true });
}
