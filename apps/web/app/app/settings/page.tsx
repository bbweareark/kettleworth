import { requireUser } from "@/lib/session";
import { getProfile, connectedProviders, aiAvailable } from "@kettleworth/api";
import { SettingsView } from "@/components/settings/settings-view";
export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";
export default async function Settings() {
  const user = await requireUser();
  const [rec, providers] = await Promise.all([getProfile(user.id), connectedProviders(user.id)]);
  return <SettingsView user={{ name: user.name, email: user.email }} profile={rec?.profile ?? null} aiSummary={rec?.aiSummary ?? null} providerCount={providers.length} ai={aiAvailable()} />;
}
