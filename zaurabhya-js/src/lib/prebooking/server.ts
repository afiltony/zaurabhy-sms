import { sendEmail } from "@/lib/mail";
import { DEFAULT_SETTINGS, type PrebookingSettings } from "@/lib/prebooking/config";
import { DatabaseNotConfiguredError, getDb } from "@/lib/prebooking/db";
import { createPrebookingService } from "@/lib/prebooking/service";

/** The pre-booking service wired to the real database and SMTP mailer. */
export const prebooking = createPrebookingService({
  getDb,
  mailer: { send: sendEmail },
  adminEmail: process.env.ADMIN_ORDER_EMAIL || "lscctony@gmail.com",
});

/**
 * Settings for rendering public pages. Falls back to the defaults if the
 * database is unreachable (for example during a build), which is safe because
 * every amount is recalculated on the server when an order is placed.
 */
export async function getSettingsForDisplay(): Promise<PrebookingSettings> {
  try {
    return await prebooking.getSettings();
  } catch (err) {
    if (!(err instanceof DatabaseNotConfiguredError)) {
      console.error("Pre-booking: could not load settings, showing defaults:", err);
    }
    return DEFAULT_SETTINGS;
  }
}
