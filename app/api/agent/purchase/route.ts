import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Setting from "@/models/Setting";
import StoreBundle from "@/models/StoreBundle";
import AgentStore from "@/models/AgentStore";
import Bundle from "@/models/Bundle";
import mongoose from "mongoose";
import Transaction from "@/models/Transaction";
import { handleDakazina, handleSpendless, handleDatamart } from "@/components/providers/apiProviders";


export async function POST(req: Request) {


    try {

        const session = await getServerSession(authOptions);
       
        
        return NextResponse.json({
          message: "Testing Webhook  Agent purchase route",
          status: 200
        })


    //     const { bundleId, phoneNumber, agentId, reference } = await req.json();

    //     if (!bundleId || !phoneNumber || !agentId || !reference) {
    //         return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    //     }

    //     await dbConnect();

    //     // Check if orders are closed
    //     const ordersClosedDoc = await Setting.findOne({ key: "ordersClosed" }).select("value");
    //     if (Boolean(ordersClosedDoc?.value) && session?.user?.role !== "admin") {
    //         return NextResponse.json({ message: "Orders are currently closed" }, { status: 403 });
    //     }

    //     // Get StoreBundle details (custom price and base price) for the specific agent
    //     const storeBundle = await StoreBundle.findOne({ bundle: bundleId, agent: agentId });
    //     console.log('StoreBundle:', storeBundle);
    //     if (!storeBundle) {
    //         return NextResponse.json({ message: "Bundle not found in this store" }, { status: 404 });
    //     }

    //     // agentId is already provided, but we can also use storeBundle.agent just to be safe

    //      console.log('Agent ID:', agentId);
    //     // Get the real bundle details for Dakazi
    //     const bundle = await Bundle.findById(bundleId);
    //     if (!bundle || !bundle.isActive) {
    //         return NextResponse.json({ message: "Original bundle is no longer active" }, { status: 404 });
    //     }

    //     const customPrice = storeBundle.customPrice;
    //     const basePrice = storeBundle.basePrice;
    //     const profit = customPrice - basePrice;

    //     // Get agent  
    //     const agent = await User.findById(agentId);
    //     console.log('Agent:', agent);
    //     if (!agent) {
    //         return NextResponse.json({ message: "No Shop found" }, { status: 404 });
    //     }

      

        
    //  const DAKAZI_API_KEY=process.env.DAKAZI_API_KEY!;
    // const SPENDLESS_API_KEY=process.env.SPENDLESS_API_KEY!;

      
    //     const network = bundle.network;
    //     console.log(" bundle", bundle)
        
    //     // Prevent replay attacks
    //     const existingOrder = await Order.findOne({ payment_id: reference });
    //     if (existingOrder) {
    //         return NextResponse.json({ message: "Duplicate transaction reference" }, { status: 409 });
    //     }

    //     const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    //     if (!PAYSTACK_SECRET_KEY) {
    //         return NextResponse.json({ message: "unexpected error occurred" }, { status: 500 });
    //     }

    //     const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    //         headers: {
    //             Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    //         },
    //     });

    //     const paystackData = await verifyResponse.json();

    //     if (!paystackData.data || paystackData.data.status !== 'success') {
    //         console.log('Payment verification failed');
    //         return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    //     }

    //     const { amount } = paystackData.data;
    //     const tax = 0.02 * customPrice;
    //     let total = customPrice + tax;
    //     total = Math.round(total * 100) / 100;

    //     if (amount / 100 !== Number(total)) {
    //         console.log('Payment amount does not match');
    //         return NextResponse.json({ message: "Payment amount does not match" }, { status: 400 });
    //     }



     
    //     // Create transaction log for the agent
      
    //   if(session?.user.id){ 
    //     await Transaction.create({
    //         user: agentId,
    //         transactionType: 'debit',
    //         type: 'purchase',
    //         amount: customPrice,
    //         reference: reference,
    //         description: `Store sale deduction: ${network} ${bundle.name} for ${phoneNumber}`,
    //         status: 'success'
    //     });
    // }

    //     // Create initial order record
    //     const order = await Order.create({
    //         user: agentId as mongoose.Types.ObjectId,
    //         agent: agentId as mongoose.Types.ObjectId,
    //         transaction_id: reference,
    //         network: network,
    //         bundleName: parseFloat(bundle.name.trim()).toString(),
    //         price: customPrice,
    //         originalPrice: basePrice,
    //         phoneNumber: phoneNumber,
    //         payment_id: reference,  
    //         status: 'processing',
    //     });

    //     console.log("Order created", order)


    //      const profitUser = await AgentStore.findOneAndUpdate(
    //         {user:agentId},
    //         {$inc:{totalProfit:profit, totalSalesCount: 1}},
    //         {new:true}
    //      )

    //      console.log("Agent profit updated", profitUser)
 
    //      if (!profitUser) {
    //         console.log("Profit user not found")
    //         return NextResponse.json({ message: "Transaction failed: Insufficient agent balance" }, { status: 400 });
    //     }


    //     if (!DAKAZI_API_KEY || !SPENDLESS_API_KEY){
    //         console.log("DAKAZI_API_KEY", DAKAZI_API_KEY);
    //     console.log("SPENDLESS_API_KEY", SPENDLESS_API_KEY);
    //         console.log("API keys not found")
    //       return NextResponse.json({ message: "unexpected error occurred" }, { status: 500 });
    //     }

        
    //     const data = {
    //       network,
    //       bundleName: parseFloat(bundle.name.trim()),
    //       price: customPrice,
    //       phoneNumber,
    //       reference,
    //     }


    //     const providerDoc = await Setting.findOne({ key: "provider" });
    //     const provider = providerDoc?.value || "dakazina";


    //     let response;

    //     if (provider === "dakazina") {
    //       response = await handleDakazina(order, data, DAKAZI_API_KEY);
    //     } else if (provider === "spendless") {
    //       response = await handleSpendless(order, data, SPENDLESS_API_KEY);
    //     } else if (provider === "datamart") {
    //       const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;
    //       response = await handleDatamart(order, data, DATAMART_API_KEY);
    //     }
        
            
    //         return NextResponse.json(
    //           { message: "Order created successfully", response },
    //           { status: 201 }
    //         );

    } catch (error: any) {
        console.error("Agent wallet purchase error:", error);
        return NextResponse.json({ message: error.message || "Error processing purchase" }, { status: 500 });
    }
}
