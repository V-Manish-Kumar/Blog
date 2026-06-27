import { getPlatformActivityMap } from "@/lib/actions/analytics";

export async function GET() {
  try {
    const activityMap = await getPlatformActivityMap();
    return Response.json(activityMap);
  } catch (error: any) {
    console.error("Failed to fetch platform activity:", error);
    return Response.json({ error: "Failed to load activity" }, { status: 500 });
  }
}
