// import { NextResponse } from "next/server";
// import { sql } from "@/lib/db";
// import { auth } from "@clerk/nextjs/server";

// export async function GET() {
//   const { userId } = auth();

//   if (!userId) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const result = await sql`
//     SELECT * FROM users WHERE clerk_id = ${userId}
//   `;

//   return NextResponse.json(result);
// }
