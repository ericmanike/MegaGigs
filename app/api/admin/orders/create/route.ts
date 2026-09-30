import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import Setting from "@/models/Setting";
import Bundle from "@/models/Bundle";
import mongoose from "mongoose";
import { handleDakazina, handleSpendless, handleDatamart, handleDataBundlesHub } from "@/components/providers/apiProviders";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { network, bundleName, phoneNumber } = await req.json();

        console.log('Received admin order create data:', { network, bundleName, phoneNumber });

        if (!network || !bundleName || !phoneNumber) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        // Optional: fetch real price from bundle if we want to store it in the order
        const dbPrice = await Bundle.findOne({
            name: bundleName + "GB",
            network: network,
            isActive: true
        }).select('price');
        
        const realPrice = dbPrice ? dbPrice.price : 0; // Admin order, price is just for record

        const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY;
        const SPENDLESS_API_KEY = process.env.SPENDLESS_API_KEY;

        if (!DAKAZI_API_KEY || !SPENDLESS_API_KEY) {
            return NextResponse.json({ message: "Unexpected error occurred: Missing API keys" }, { status: 500 });
        }

        const reference = `admin_ord_${Date.now()}_${session.user.id}`;

        const createdOrder = await Order.create({
            user: session.user.id, // Admin as the user
            transaction_id: reference,
            network: network,
            bundleName: bundleName,
            price: realPrice,
            payment_id: reference,
            phoneNumber: phoneNumber,
            status: 'processing',
        });

        const providerDoc = await Setting.findOne({ key: "provider" });
        const provider = providerDoc?.value || "dakazina";

        if (provider === 'dakazina') {
            handleDakazina(createdOrder, {phoneNumber, reference, network, bundleName}, DAKAZI_API_KEY);
        } else if (provider === 'spendless') {
            handleSpendless(createdOrder, {phoneNumber, reference, network, bundleName}, SPENDLESS_API_KEY);
        } else if (provider === 'datamart') {
            const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;
            handleDatamart(createdOrder, {phoneNumber, reference, network, bundleName}, DATAMART_API_KEY);
        } else if (provider === 'databundleshub' || provider === 'dataBundlesHub') {
            const DATABUNDLESHUB_API_KEY = process.env.DATABUNDLESHUB_API_KEY!
            handleDataBundlesHub(createdOrder, {phoneNumber, reference, network, bundleName}, DATABUNDLESHUB_API_KEY);
        } else {
            return NextResponse.json({message: 'API provider not defined'}, { status: 400 });
        }

        console.log('📦 New admin order created:', createdOrder);
        return NextResponse.json({
            message: "Order created successfully",
            order: createdOrder
        }, { status: 201 });

    } catch (error) {
        console.error("Admin order create error:", error);
        return NextResponse.json({ message: "Error processing admin order" }, { status: 500 });
    }
}

