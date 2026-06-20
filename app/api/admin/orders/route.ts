import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET() {


    console.log("Testing Webhook")
    NextResponse.json({
        message: "Testing Webhook",
        status:200
    })

    try {
        const session = await getServerSession(authOptions);
        const role = session?.user?.role;
        if (!session || (role !== 'admin' && role !== 'moderator')) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();
        const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).limit(200);

        return NextResponse.json(orders);
    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const body = await req.json().catch(() => ({}));
    const { status } = body;
    if (!status) {
        return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }
    const allowedStatuses = ['pending', 'delivered', 'failed', 'reversed', 'processing', 'placed'];
    if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findById(body.id);
    if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    order.status = status;
    await order.save();
    return NextResponse.json(order);




}