import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/mocks/module1";
import { listAnnonces } from "@/modules/diffusion/annonces/queries";

const schema = z.object({
  q: z.string().trim().max(100).optional(),
  tag: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: Request) {
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = schema.safeParse(sp);
  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  try {
    const session = await getSession();
    const data = await listAnnonces({ session, ...parsed.data });
    return NextResponse.json(data);
  } catch (e) {
    console.error("[GET /api/annonces]", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
