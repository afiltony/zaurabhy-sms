import { redirect } from "next/navigation";
import { loginAction } from "@/app/admin/actions";
import { isAdmin, isAdminConfigured } from "@/lib/prebooking/admin-auth";

const ERRORS: Record<string, string> = {
  invalid: "Incorrect password.",
  locked: "Too many attempts. Please wait 15 minutes and try again.",
};

export default async function AdminLoginPage(props: PageProps<"/admin/login">) {
  if (await isAdmin()) redirect("/admin");
  const { error } = await props.searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-border bg-white p-6">
      <h1 className="font-heading text-2xl font-bold text-ink">Admin sign in</h1>

      {isAdminConfigured() ? (
        <form action={loginAction} className="mt-5 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-ink-soft">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-border bg-white px-4 py-3 text-base outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>
          {message && (
            <p role="alert" className="text-sm text-coral">
              {message}
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-full bg-coral py-3.5 text-base font-bold text-white transition hover:bg-teal"
          >
            Sign in
          </button>
        </form>
      ) : (
        <p className="mt-4 text-sm text-ink-soft">
          Admin access is disabled. Set the <code>ADMIN_PASSWORD</code> environment variable
          (at least 10 characters) and restart the app.
        </p>
      )}
    </div>
  );
}
