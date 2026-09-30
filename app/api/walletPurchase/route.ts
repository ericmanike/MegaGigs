import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Setting from "@/models/Setting";
import Bundle from "@/models/Bundle";
import mongoose from "mongoose";
import { handleDakazina, handleSpendless, handleDatamart, handleDataBundlesHub } from "@/components/providers/apiProviders";
import Transaction from "@/models/Transaction";



export async function POST(req: Request) {
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction();

    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { network, bundleName, price, phoneNumber } = await req.json();

        console.log('Received wallet purchase data:', { network, bundleName, price, phoneNumber });

        if (!network || !bundleName || !price || !phoneNumber) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        await dbConnect();

        const ordersClosedDoc = await Setting.findOne({ key: "ordersClosed" }).select("value");
        if (Boolean(ordersClosedDoc?.value) && session.user.role !== "admin") {
            return NextResponse.json({ message: "Orders are currently closed" }, { status: 403 });
        }

        const dbPrice = await Bundle.findOne({
            name: bundleName + "GB",
            network: network,
            audience: { $in: [session.user.role, 'promo', 'user'] },
            isActive: true
        }).select('price');
        const realPrice = dbPrice ? dbPrice.price : null;

        if (realPrice === null) {
            return NextResponse.json({ message: "Bundle not found" }, { status: 404 });
        }

        console.log('Database price fetched:', dbPrice);

        // Get user and check wallet balance
        const user = await User.findById(session.user.id);
        console.log('User Topping up:', user);
        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        // Check if user has sufficient balance
        if (user.walletBalance < realPrice) {
            return NextResponse.json({
                message: "Insufficient wallet balance",
                balance: user.walletBalance,
                required: realPrice
            }, { status: 400 });
        }

        
        const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY;
        const SPENDLESS_API_KEY = process.env.SPENDLESS_API_KEY

        if (!DAKAZI_API_KEY || !SPENDLESS_API_KEY) {
            return NextResponse.json({ message: "Unexpected error occurred" }, { status: 500 });
        }

        

        // Generate unique reference
        const reference = `wallet_${Date.now()}_${session.user.id}`;

        // Check for duplicate transaction  
        const existingOrder = await Order.findOne({ transaction_id: reference });
        if (existingOrder) {
            return NextResponse.json({ message: "Duplicate transaction reference" }, { status: 409 });
        }




        // Deduct from wallet balance
const updatedUser = await User.findOneAndUpdate(
            { _id: session.user.id, walletBalance: { $gte: realPrice } },
            { $inc: { walletBalance: -realPrice } },
            { new: true, session: mongoSession }
        );

        if (!updatedUser) {
            console.log('Insufficient balance during update. Refunding wallet.');
            return NextResponse.json({ message: "Insufficient wallet balance. Transaction cancelled." }, { status: 400 });
        }



        console.log(`Deducted ${price} from wallet. New balance: ${updatedUser.walletBalance}`);

        


         
        // Create order record
       const order = await Order.create([{
            user: session.user.id,
            transaction_id: reference,
            network: network,
            bundleName: bundleName,
            price: realPrice,
            payment_id:reference,
            phoneNumber: phoneNumber,
            status: 'processing',
        }], { session: mongoSession });

        await Transaction.create([{
            user: session.user.id,
            transactionType: 'debit',
            type: 'purchase',
            amount: realPrice,
            reference: reference,
            description: `Wallet purchase of ${network} ${bundleName}GB for ${phoneNumber}`,
            status: 'success'
        }], { session: mongoSession });

      const createdOrder = order[0];


    const providerDoc = await Setting.findOne({ key: "provider" });
    const provider = providerDoc?.value || "dakazina";
  

        if (provider == 'dakazina') {
            handleDakazina(createdOrder, {phoneNumber, reference, network, bundleName}, DAKAZI_API_KEY)
        } else if (provider == 'spendless') {
            handleSpendless(createdOrder, {phoneNumber, reference, network, bundleName}, SPENDLESS_API_KEY)
        } else if (provider == 'datamart') {
            const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;
            handleDatamart(createdOrder, {phoneNumber, reference, network, bundleName}, DATAMART_API_KEY)
        } else if (provider == 'databundleshub' || provider == 'dataBundlesHub') {
            const DATABUNDLESHUB_API_KEY = process.env.DATABUNDLESHUB_API_KEY!
            handleDataBundlesHub(createdOrder, {phoneNumber, reference, network, bundleName}, DATABUNDLESHUB_API_KEY)
        } else {
            return NextResponse.json({message: 'API provider not defined'})
        }




         await mongoSession.commitTransaction();

        console.log('📦 New wallet order created:', order);
        return NextResponse.json({
            message: "Order created successfully",
            order,
            newBalance: updatedUser.walletBalance
        }, { status: 201 });

    } catch (error) {
        if( mongoSession.inTransaction()){
        await mongoSession.abortTransaction();
        }
        console.error("Wallet purchase error:", error);
        return NextResponse.json({ message: "Error processing wallet purchase" }, { status: 500 });
    } finally {
        await mongoSession.endSession();
    }
}

