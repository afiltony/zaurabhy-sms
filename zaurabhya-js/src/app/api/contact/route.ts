import { NextResponse } from "next/server";
import { contactEnquirySchema } from "@/lib/validation";
import { appendLead } from "@/lib/leads";
import { sendAutoReply, sendLeadNotification } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = contactEnquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await appendLead("contact-messages.jsonl", parsed.data);
  await sendLeadNotification("New contact form message", parsed.data);
  await sendAutoReply(
    parsed.data.email,
    parsed.data.fullName,
    "Thank you for reaching out to ZAURABHYA. We've received your message and our team will get back to you shortly.",
  );

  return NextResponse.json({ success: true });
}
