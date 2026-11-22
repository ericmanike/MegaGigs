
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";
export async function GET() {

  try {
    
  await dbConnect();

  const pendingOrders = await Order.find({ status: { $nin: ["delivered", "failed", "reversed"] } });
console.log(pendingOrders);
  for (const order of pendingOrders) {
    const res = await fetch(
      `https://reseller.dakazinabusinessconsult.com/api/v1/fetch-single-transaction`,
      {
        method: "POST",
        headers: {
          "x-api-key": process.env.DAKAZI_API_KEY!,
          "Accept": "application/json"
        },
     
        cache: "no-store",
        
      }
    );

    const data = await res.json();
    console.log("response from dakazi",data);
    const status = data.order_items[0].status.toLowerCase();

    if (data.status !== "pending") {
     await Order.findByIdAndUpdate(order._id, {
        status: status
      });
    }
  }

  
  return Response.json({ success: true });
} catch (error: any) {
  console.log("Error updating order statuses: ", error);
  return Response.json({ success: false, error: error });
}

}