import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
import SystemLog from "@/models/SystemLog";

export const dynamic = "force-dynamic";

async function processOrderCheck(request: Request) {
  try {
    await dbConnect();

    const DATABUNDLEHUB_API_KEY =
      process.env.DATABUNDLEHUB_API_KEY ||
      process.env.DATABUNDLESHUB_API_KEY ||
      process.env.DATA_BUNDLES_HUB_API_KEY;

    if (!DATABUNDLEHUB_API_KEY) {
      return NextResponse.json(
        { error: "DATABUNDLEHUB_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Find orders that are currently processing, pending, or placed
    const pendingOrders = await Order.find({
      status: { $in: ["processing", "pending", "placed"] },
    })
      .sort({ createdAt: 1 })
      .limit(50);

    if (!pendingOrders || pendingOrders.length === 0) {
      return NextResponse.json({
        success: true,
        provider: "DataBundlesHub",
        message: "No pending or processing orders to check.",
        checkedCount: 0,
        updatedToDelivered: 0,
        updatedToFailed: 0,
      });
    }

    let updatedToDelivered = 0;
    let updatedToFailed = 0;
    const results: any[] = [];

    for (const order of pendingOrders) {
      try {
        let newStatus: "delivered" | "failed" | null = null;
        let providerResponse: any = null;

        // Clean reference for DataBundlesHub
        const rawRef = order.transaction_id || order.payment_id;
        const reference = rawRef?.trim() ? rawRef.trim().replace(/^nexa-/, "") : "";

        if (!reference) continue;

        // DataBundlesHub Status Check
        const res = await fetch(
          `https://www.databundleshub.com/api/check_order_status?order_id=${encodeURIComponent(reference)}`,
          {
            method: "GET", 
            headers: {
              "Authorization": `Bearer ${DATABUNDLEHUB_API_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (res.ok) {
          providerResponse = await res.json();
          const orderObj = providerResponse?.order;


          console.log('databundle status check res:  ', providerResponse)
          const statusStr = (
            orderObj?.status ||
            providerResponse?.status ||
            providerResponse?.data?.status ||
            ""
          ).toLowerCase();

          const isCompleted = orderObj?.is_completed;

          if (
            ["delivered", "completed", "success", "successful", "done"].includes(statusStr) ||
            isCompleted === true
          ) {
            newStatus = "delivered";
          } else if (
            ["failed", "error", "rejected", "cancelled", "canceled", "refunded"].includes(statusStr) ||
            (providerResponse?.success === false && statusStr !== "pending" && statusStr !== "processing")
          ) {
            newStatus = "failed";
          }
        }

        if (newStatus) {
          const oldStatus = order.status;
          order.status = newStatus;
          await order.save();

          if (newStatus === "delivered") updatedToDelivered++;
          if (newStatus === "failed") updatedToFailed++;

          results.push({
            orderId: order._id,
            reference,
            previousStatus: oldStatus,
            newStatus,
            providerResponse,
          });
        }
      } catch (orderErr: any) {
        console.error(`Error checking DataBundlesHub status for order ${order._id}:`, orderErr);
      }
    }

    // Log cron execution summary
    await SystemLog.create({
      level: "info",
      category: "system",
      message: `DataBundlesHub Cron: Checked ${pendingOrders.length} pending orders. Delivered: ${updatedToDelivered}, Failed: ${updatedToFailed}`,
      meta: { checkedCount: pendingOrders.length, updatedToDelivered, updatedToFailed },
    });

    return NextResponse.json({
      success: true,
      provider: "DataBundlesHub",
      message: `Checked ${pendingOrders.length} pending orders with DataBundlesHub.`,
      checkedCount: pendingOrders.length,
      updatedToDelivered,
      updatedToFailed,
      results,
    });
  } catch (error: any) {
    console.error("Error in /api/check_order_status:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return processOrderCheck(request);
}

export async function POST(request: Request) {
  return processOrderCheck(request);
}
