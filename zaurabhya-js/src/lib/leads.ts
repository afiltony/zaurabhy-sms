import { mkdir, appendFile } from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export async function appendLead(
  fileName:
    | "wholesale-enquiries.jsonl"
    | "export-enquiries.jsonl"
    | "dealer-registrations.jsonl",
  record: Record<string, unknown>,
) {
  await mkdir(DATA_DIR, { recursive: true });
  const line = `${JSON.stringify({ ...record, submittedAt: new Date().toISOString() })}\n`;
  await appendFile(path.join(DATA_DIR, fileName), line, "utf8");
}
