import { NextResponse } from "next/server";
import { wholesaleEnquirySchema } from "@/lib/validation";
import { appendLead } from "@/lib/leads";
import { sendAutoReply, sendLeadNotification } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = wholesaleEnquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await appendLead("wholesale-enquiries.jsonl", parsed.data);
  await sendLeadNotification("New wholesale enquiry", parsed.data);
  await sendAutoReply(
    parsed.data.email,
    parsed.data.businessName,
    "Thank you for your wholesale price enquiry. We've received your details and our team will get back to you with pricing shortly.",
  );

  return NextResponse.json({ success: true });
}
