import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import Setting from "@/models/Setting";
import StoreBundle from "@/models/StoreBundle";
import AgentStore from "@/models/AgentStore";
import Bundle from "@/models/Bundle";
import Transaction from "@/models/Transaction";
import SystemLog from "@/models/SystemLog";
import { handleDakazina, handleSpendless, handleDatamart } from "@/components/providers/apiProviders";
import crypto from "crypto";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();

    const key = process.env.PAYSTACK_SECRET_KEY;
    if (!key) {
      console.error("PAYSTACK_SECRET_KEY is not defined in env variables");
   
      return NextResponse.json({ error: "Webhook signature key missing" }, { status: 500 });
    }

    const rawBody = await request.text();
    const expectedSignature = crypto
      .createHmac("sha512", key)
      .update(rawBody)
      .digest("hex");

     console.log("raw body", rawBody,  "expectedSignature", expectedSignature)
    const receivedSignature = request.headers.get("x-paystack-signature");

    if (!receivedSignature || expectedSignature !== receivedSignature) {
      console.warn("Paystack Webhook: Invalid signature received");
      await SystemLog.create({
        level: "warn",
        category: "webhook",
        message: "Paystack Webhook: Invalid signature received",
        meta: { receivedSignature },
      });
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    console.log("Paystack webhook event received:", payload.event);

    if (payload.event !== "charge.success") {
      return NextResponse.json({ message: `Ignored event: ${payload.event}` }, { status: 200 });
    }

    const { reference, status: paymentStatus, amount, metadata: rawMetadata } = payload.data;

    if (paymentStatus !== "success") {
      console.log(`Paystack Webhook: Payment status is ${paymentStatus}. Skipping.`);
      return NextResponse.json({ message: `Payment status is ${paymentStatus}` }, { status: 200 });
    }

    // Parse metadata
    let metadata = rawMetadata;
    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }
    metadata = metadata || {};

    // // Check if orders are closed
    // const ordersClosedDoc = await Setting.findOne({ key: "ordersClosed" }).select("value");
    // if (Boolean(ordersClosedDoc?.value)) {
    //   console.warn("Paystack Webhook: Orders are closed but payment went through.");
    //   await SystemLog.create({
    //     level: "warn",
    //     category: "webhook",
    //     message: "Paystack Webhook: Payment received while orders are closed",
    //     meta: { reference, amount, metadata },
    //   });
    // }

    // Prevent duplicate orders
    const existingOrder = await Order.findOne({ payment_id: reference });
    if (existingOrder) {
      console.log(`Paystack Webhook: Order already exists for reference ${reference}. Skipping.`);
      return NextResponse.json({ message: "Order already exists for this reference" }, { status: 200 });
    }

    const purchaseType = metadata.purchaseType;

    if (purchaseType === "standard") {
      const { network, bundleName, price, phoneNumber, userId } = metadata;

      if (!network || !bundleName || !price || !phoneNumber) {
        throw new Error("Missing required standard metadata fields: network, bundleName, price, phoneNumber");
      }

      // Create order
      const order = await Order.create({
        ...(userId ? { user: userId as any } : {}),
        transaction_id: "paid_" + reference,
        network: network,
        bundleName: bundleName,
        payment_id: reference,
        price: price,
        status: "processing",
        phoneNumber: phoneNumber,
      });

      console.log("Paystack Webhook: Created standard order:", order._id);

      // Create transaction log if user is authenticated
      if (userId) {
        const tax = 0.02 * price;
        let total = price + tax;
        total = Math.round(total * 100) / 100;

        await Transaction.create({
          user: userId as any,
          transactionType: "debit",
          type: "purchase",
          amount: total,
          reference: reference,
          description: `Purchase of ${network} ${bundleName}GB for ${phoneNumber} via Paystack (Webhook)`,
          status: "success",
        });
      }

      // Call external provider to send data bundle
      const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY!;
      const SPENDLESS_API_KEY = process.env.SPENDLESS_API_KEY!;
      const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;

      const providerDoc = await Setting.findOne({ key: "provider" });
      const provider = providerDoc?.value || "dakazina";

      const providerData = {
        network,
        bundleName,
        price,
        phoneNumber,
        reference,
      };

     let providerResponse;
      // if (provider === "dakazina" && DAKAZI_API_KEY) {
      //   providerResponse = await handleDakazina(order, providerData, DAKAZI_API_KEY);
      // } else if (provider === "spendless" && SPENDLESS_API_KEY) {
      //   providerResponse = await handleSpendless(order, providerData, SPENDLESS_API_KEY);
      // } else if (provider === "datamart" && DATAMART_API_KEY) {
      //   providerResponse = await handleDatamart(order, providerData, DATAMART_API_KEY);
      // }

      await SystemLog.create({
        level: "info",
        category: "webhook",
        message: `Paystack Webhook: Processed standard order ${order._id}`,
        meta: { orderId: order._id, reference, provider, providerResponse },
      });

      return NextResponse.json({ message: "Standard order created successfully", orderId: order._id }, { status: 201 });

    } else if (purchaseType === "agent_store") {
      const { bundleId, agentId, phoneNumber } = metadata;

      if (!bundleId || !agentId || !phoneNumber) {
        throw new Error("Missing required agent_store metadata fields: bundleId, agentId, phoneNumber");
      }

      const storeBundle = await StoreBundle.findOne({ bundle: bundleId, agent: agentId });
      if (!storeBundle) {
        throw new Error(`StoreBundle not found for bundle: ${bundleId}, agent: ${agentId}`);
      }

      const bundle = await Bundle.findById(bundleId);
      if (!bundle || !bundle.isActive) {
        throw new Error(`Original bundle not active or not found: ${bundleId}`);
      }

      const agent = await User.findById(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const customPrice = storeBundle.customPrice;
      const basePrice = storeBundle.basePrice;
      const profit = customPrice - basePrice;
      const network = bundle.network;

      // Create transaction log for the agent
      await Transaction.create({
        user: agentId as mongoose.Types.ObjectId,
        transactionType: "debit",
        type: "purchase", 
        amount: customPrice,
        reference: reference,
        description: `Store sale deduction: ${network} ${bundle.name} for ${phoneNumber} (Webhook)`,
        status: "success",
      });

      // Create initial order record
      const order = await Order.create({
        user: agentId as mongoose.Types.ObjectId,
        agent: agentId as mongoose.Types.ObjectId,
        transaction_id: "store_" +reference,
        network: network,  
        bundleName: parseFloat(bundle.name.trim()).toString(),
        price: customPrice,
        originalPrice: basePrice,
        phoneNumber: phoneNumber,
        payment_id: reference,
        status: "processing",
      });

      console.log("Paystack Webhook: Created agent store order:", order._id);

      // Update agent store stats
      await AgentStore.findOneAndUpdate(
        { user: agentId },
        { $inc: { totalProfit: profit, totalSalesCount: 1 } },
        { new: true }
      );

      // Call external provider to send data bundle
      const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY!;
      const SPENDLESS_API_KEY = process.env.SPENDLESS_API_KEY!;
      const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY!;

      const providerDoc = await Setting.findOne({ key: "provider" });
      const provider = providerDoc?.value || "dakazina";

      const providerData = {
        network,
        bundleName: parseFloat(bundle.name.trim()),
        price: customPrice,
        phoneNumber,
        reference,
      };

      let providerResponse;
      // if (provider === "dakazina" && DAKAZI_API_KEY) {
      //   providerResponse = await handleDakazina(order, providerData, DAKAZI_API_KEY);
      // } else if (provider === "spendless" && SPENDLESS_API_KEY) {
      //   providerResponse = await handleSpendless(order, providerData, SPENDLESS_API_KEY);
      // } else if (provider === "datamart" && DATAMART_API_KEY) {
      //   providerResponse = await handleDatamart(order, providerData, DATAMART_API_KEY);
      // }

      await SystemLog.create({
        level: "info",
        category: "webhook",
        message: `Paystack Webhook: Processed agent store order ${order._id}`,
        meta: { orderId: order._id, reference, provider, providerResponse },
      });

      return NextResponse.json({ message: "Agent store order created successfully", orderId: order._id }, { status: 201 });

    } else {
      // Unknown or missing purchaseType
      console.warn("Paystack Webhook: Unknown or missing purchaseType in metadata", purchaseType);
      await SystemLog.create({
        level: "warn",
        category: "webhook",
        message: "Paystack Webhook: Unknown or missing purchaseType in metadata",
        meta: { reference, amount, metadata },
      });
      return NextResponse.json({ message: "Webhook received but missing/unrecognized purchaseType" }, { status: 200 });
    }

  } catch (error: any) {
    console.error("Paystack Webhook error:", error);
    try {
      await SystemLog.create({
        level: "error",
        category: "webhook",
        message: `Paystack Webhook error: ${error.message || "Unknown error"}`,
        meta: { stack: error.stack },
      });
    } catch (_) {}
    return NextResponse.json({ error: "Webhook processing error" }, { status: 500 });
  }
}
