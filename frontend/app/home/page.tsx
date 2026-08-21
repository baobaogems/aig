// /app/home/page.tsx — the landing page moved to "/". This route stays as a
// permanent redirect so links shared during the pilot keep working.

import { redirect } from "next/navigation";

export default function HomeRedirect() {
  redirect("/");
}
