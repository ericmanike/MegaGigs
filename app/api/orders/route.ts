import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import Setting from "@/models/Setting";
import { handleDakazina, handleSpendless, handleDatamart } from "@/components/providers/apiProviders";
import { createOrder } from "@/lib/orderService";
import Transaction from "@/models/Transaction";



export async function POST(req: Request) {


    console.log("Testing Webhook")
    NextResponse.json({
        message: "Testing Webhook",
        status:200
    })
  try {
    
    // Session is optional — guests can place orders too
    const session = await getServerSession(authOptions);

    // const ip = session.user.id;
    // console.log(  'order rate limit identifier:', ip)
    // const { success } = await orderRateLimit.limit(ip);

    // if (!success) {
    //   return NextResponse.json({ message: "Too many order attempts. Please try again later." }, { status: 429 });
    // }

    const { network, bundleName, price, phoneNumber, reference } = await req.json();

    console.log('Received data:', { network, bundleName, price, phoneNumber, reference });
    if (!network || !bundleName || !price || !phoneNumber || !reference) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const ordersClosedDoc = await Setting.findOne({ key: "ordersClosed" }).select("value");
    if (Boolean(ordersClosedDoc?.value) && session?.user?.role !== "admin") {
      return NextResponse.json({ message: "Orders are currently closed" }, { status: 403 });
    }


  
      
  

    // prevent replay attack
    const existingOrder = await Order.findOne({ payment_id: reference });
    if (existingOrder) {
      return NextResponse.json({ message: "Duplicate transaction reference" }, { status: 409 });
    }


    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
  

    if (!PAYSTACK_SECRET_KEY) {
      console.log('Paystack secret key not found')
      return NextResponse.json({ message: "unexpected error occurred" }, { status: 500 });
    }


    


    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const paystackData = await verifyResponse.json()

    //  console.log('Payment verification response:', paystackData)
    if (!paystackData.data) {
      console.log('Payment verification failed no data')
      return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    }

    const { amount } = paystackData.data

    const realPrice = await Order.findOne({ bundleName: bundleName , audience: session?.user?.role}).select("price");


    const tax = 0.02 * price
    let total = price + tax
    console.log('Total before rounding:', total)
    total = Math.round(total * 100) / 100
    console.log('Total after rounding:', total)


    console.log('Expected price:')
    console.log('Payment amount:', amount / 100)

    if (amount / 100 !== Number(total)) {
      console.log('Payment amount does not match')
      return NextResponse.json({ message: "Payment amount does not match" }, { status: 400 });
    }

    if (paystackData.data.status !== 'success') {
      console.log('Payment verification failed')
      return NextResponse.json({ message: "Payment verification failed" }, { status: 400 });
    }


    const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY!;
    const SPENDLESS_API_KEY = process.env.SPENDLESS_API_KEY!;

    if (!DAKAZI_API_KEY || !SPENDLESS_API_KEY) {
      return NextResponse.json({ message: "unexpected error occurred" }, { status: 500 });
    }
    const data = {
      network,
      bundleName,
      price,
      phoneNumber,
      reference,
    }
    
    const order = await createOrder(session, data);

    if(session?.user.id){
        await Transaction.create({
            user: session?.user?.id,  
            transactionType: 'debit',
            type: 'purchase',
            amount: total,
            reference: reference,
            description: `Purchase of ${network} ${bundleName}GB for ${phoneNumber} via Paystack`,
            status: 'success'
        });
    }
    



    const providerDoc = await Setting.findOne({ key: "provider" });
    const provider = providerDoc?.value || "dakazina";

    let response;

    if (provider === "dakazina") {
      response = await handleDakazina(order, data, DAKAZI_API_KEY);
    } else if (provider === "spendless") {
      response = await handleSpendless(order, data, SPENDLESS_API_KEY);
    } else if (provider === "datamart") {
      const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;
      response = await handleDatamart(order, data, DATAMART_API_KEY);
    }

    return NextResponse.json(
      { message: "Order created successfully", response },
      { status: 201 }
    );

  


  } catch (error) {
    console.log('Error creating order:', error)
  
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}
