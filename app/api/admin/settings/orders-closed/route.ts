import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Setting from "@/models/Setting";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const doc = await Setting.findOne({ key: "ordersClosed" }).select("value");
    const provider = await Setting.findOne({ key: "provider" }).select("value");
    const ordersClosed = Boolean(doc?.value);
    return NextResponse.json({ ordersClosed, provider: provider?.value || "dakazina" });
  } catch (error) {
    console.error("admin orders-closed GET error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ordersClosed } = body as { ordersClosed?: boolean };
    if (typeof ordersClosed !== "boolean") {
      return NextResponse.json({ message: "ordersClosed must be boolean" }, { status: 400 });
    }

    await dbConnect();
    const doc = await Setting.findOneAndUpdate(
      { key: "ordersClosed" },
      { value: ordersClosed },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select("value");

    return NextResponse.json({ ordersClosed: Boolean(doc?.value) });
  } catch (error) {
    console.error("admin orders-closed PATCH error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { provider } = body as { provider?: string };
    const allowed = ["dakazina", "spendless", "datamart", "databundleshub"];
    if (typeof provider !== "string" || !allowed.includes(provider)) {
      return NextResponse.json({ message: "provider must be one of: " + allowed.join(", ") }, { status: 400 });
    }

    await dbConnect();
    const doc = await Setting.findOneAndUpdate(
      { key: "provider" },
      { value: provider },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select("value");

    return NextResponse.json({ provider: doc?.value || provider });
  } catch (error) {
    console.error("admin provider POST error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

