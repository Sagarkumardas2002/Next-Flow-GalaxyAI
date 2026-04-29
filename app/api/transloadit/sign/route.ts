// export const runtime = "nodejs";

// import { auth } from "@clerk/nextjs/server";
// import crypto from "crypto";

// // Signs a Transloadit assembly params server-side so the secret never
// // reaches the browser. The client sends params, we sign them and return
// // the signature + expiry.
// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const secret = process.env.TRANSLOADIT_SECRET;
//     const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;

//     if (!secret || !key) {
//       return Response.json(
//         { error: "Transloadit credentials not configured" },
//         { status: 500 },
//       );
//     }

//     const { params } = await req.json();

//     // Transloadit requires expires in UTC format
//     const expires = new Date(Date.now() + 30 * 60 * 1000) // 30 min
//       .toISOString()
//       .replace("T", " ")
//       .replace(/\.\d{3}Z$/, "+00:00");

//     const fullParams = JSON.stringify({ ...JSON.parse(params), expires });

//     const signature = crypto
//       .createHmac("sha384", secret)
//       .update(Buffer.from(fullParams, "utf-8"))
//       .digest("hex");

//     return Response.json({
//       params: fullParams,
//       signature: `sha384:${signature}`,
//       expires,
//     });
//   } catch (err) {
//     console.error("❌ /api/transloadit/sign:", err);
//     return Response.json({ error: String(err) }, { status: 500 });
//   }
// }

// export const runtime = "nodejs";

// import { auth } from "@clerk/nextjs/server";
// import crypto from "crypto";

// export async function POST(req: Request) {
//   try {
//     const { userId } = await auth();
//     if (!userId) {
//       return Response.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const secret = process.env.TRANSLOADIT_SECRET;
//     const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;

//     if (!secret || !key) {
//       return Response.json(
//         { error: "Transloadit credentials not configured" },
//         { status: 500 },
//       );
//     }

//     const { params } = await req.json();

//     const expires = new Date(Date.now() + 30 * 60 * 1000)
//       .toISOString()
//       .replace("T", " ")
//       .replace(/\.\d{3}Z$/, "+00:00");

//     const fullParams = JSON.stringify({ ...JSON.parse(params), expires });

//     const signature = crypto
//       .createHmac("sha384", secret)
//       .update(Buffer.from(fullParams, "utf-8"))
//       .digest("hex");

//     return Response.json({
//       params: fullParams,
//       signature: `sha384:${signature}`,
//       expires,
//     });
//   } catch (err) {
//     console.error("❌ /api/transloadit/sign:", err);
//     return Response.json({ error: String(err) }, { status: 500 });
//   }
// }

export const runtime = "nodejs";

import { auth } from "@clerk/nextjs/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const secret = process.env.TRANSLOADIT_SECRET;
    const key = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;

    if (!secret || !key) {
      return Response.json(
        { error: "Transloadit credentials not configured" },
        { status: 500 },
      );
    }

    const { params } = await req.json();
    const parsedParams = JSON.parse(params);

    // ✅ expires must be inside the auth object
    const expires = new Date(Date.now() + 30 * 60 * 1000)
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d{3}Z$/, "+00:00");

    const fullParams = JSON.stringify({
      ...parsedParams,
      auth: {
        key,
        expires, // ✅ expires goes HERE inside auth
      },
    });

    console.log("📦 Full params being signed:", fullParams);

    const signature = crypto
      .createHmac("sha384", secret)
      .update(Buffer.from(fullParams, "utf-8"))
      .digest("hex");

    return Response.json({
      params: fullParams,
      signature: `sha384:${signature}`,
      expires,
    });
  } catch (err) {
    console.error("❌ /api/transloadit/sign:", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
