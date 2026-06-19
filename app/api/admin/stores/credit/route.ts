import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import AgentStore from "@/models/AgentStore";
import User from "@/models/User"; // Ensure User model is loaded for populate
import SystemLog from "@/models/SystemLog";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Check if user is admin
        if (!session || session.user.role !== 'admin') {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { storeId, amount } = await req.json();

        if (!storeId || amount === undefined) {
            return NextResponse.json({ message: "Store ID and amount are required" }, { status: 400 });
        }

        const creditAmount = parseFloat(amount);
        if (isNaN(creditAmount) || creditAmount <= 0) {
            return NextResponse.json({ message: "Amount must be a positive number" }, { status: 400 });
        }

        await dbConnect();

        const store = await AgentStore.findById(storeId).populate('user', 'name email');
        if (!store) {
            return NextResponse.json({ message: "Agent Store not found" }, { status: 404 });
        }

        // Increment the totalProfit of the agent store
        const updatedStore = await AgentStore.findByIdAndUpdate(
            storeId,
            { $inc: { totalProfit: creditAmount } },
            { new: true }
        ).populate('user', 'name email');

        if (!updatedStore) {
            return NextResponse.json({ message: "Failed to update store profit" }, { status: 500 });
        }

        // Create a system log for auditing admin actions
        await SystemLog.create({
            level: "info",
            category: "agent",
            message: `Admin ${session.user.email} credited profit of GH₵${creditAmount} to store "${store.storeName}" (${store.slug}).`,
            meta: {
                adminEmail: session.user.email,
                storeId,
                storeName: store.storeName,
                agentEmail: (store.user as any)?.email,
                amount: creditAmount,
                newProfit: updatedStore.totalProfit
            }
        });

        return NextResponse.json({
            message: "Store profit credited successfully",
            store: updatedStore
        }, { status: 200 });

    } catch (error: any) {
        console.error("Admin credit store profit error:", error);
        return NextResponse.json({ message: "Error crediting store profit" }, { status: 500 });
    }
}
