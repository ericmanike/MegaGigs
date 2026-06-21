import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();
    const ordersClosedDoc = await Setting.findOne({ key: "ordersClosed" }).select("value");
    return NextResponse.json({
      ordersClosed: ordersClosedDoc ? Boolean(ordersClosedDoc.value) : false,
    });
  } catch (error: any) {
    console.error("Error checking orders closed status:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
