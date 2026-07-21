import { NextResponse } from "next/server";
import { exportEnquirySchema } from "@/lib/validation";
import { appendLead } from "@/lib/leads";
import { sendAutoReply, sendLeadNotification } from "@/lib/mail";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = exportEnquirySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid submission", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  await appendLead("export-enquiries.jsonl", parsed.data);
  await sendLeadNotification("New export enquiry", parsed.data);
  await sendAutoReply(
    parsed.data.email,
    parsed.data.companyName,
    "Thank you for your export enquiry. Our export team will review your requirements and get back to you shortly.",
  );

  return NextResponse.json({ success: true });
}
