import { getProfile } from "@kettleworth/api";
import { requireUser } from "@/lib/session";
import { StylePicker } from "@/components/style/style-picker";

export const metadata = { title: "Your world" };
export const dynamic = "force-dynamic";

export default async function StyleScreen() {
  const user = await requireUser();
  const rec = await getProfile(user.id);
  const style = rec?.profile.style ?? "carbon";
  return <StylePicker current={style} locked={!!rec?.profile.styleLockedAt} />;
}
