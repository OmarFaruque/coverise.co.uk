import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const filename = searchParams.get('filename');

  if (!filename || !req.body) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  try {
    const blob = await put(filename, req.body, {
      access: 'public',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error("Logo upload failed:", error);
    return NextResponse.json({ error: "Logo upload failed" }, { status: 500 });
  }
}
