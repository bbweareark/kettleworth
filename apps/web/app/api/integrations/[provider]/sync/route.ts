import { HealthProvider } from "@kettleworth/types";
import { syncProvider } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId, params }) => syncProvider(userId, HealthProvider.parse(params.provider)));
