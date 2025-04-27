import { redirect } from "next/navigation";

/**
 * Redirect from dashboard route to dashboard/main
 */
export default function DashboardRootPage() {
  redirect("/dashboard");

  // This will never be rendered
  return null;
}
