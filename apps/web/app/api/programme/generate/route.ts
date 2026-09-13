import { generateAndSaveProgramme } from "@kettleworth/api";
import { route } from "@/lib/api";
export const POST = route(undefined, async ({ userId }) => { const p = await generateAndSaveProgramme(userId); return { id: p.id, name: p.name }; });
