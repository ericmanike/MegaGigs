import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import Order from '@/models/Order';
import Setting from '@/models/Setting';
import { handleDakazina, handleSpendless, handleDatamart, handleDataBundlesHub } from '@/components/providers/apiProviders';
// Delete an order
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await dbConnect();

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Update an order (e.g. mark as delivered)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions); const role = session?.user?.role;
    if (!session || (role !== 'admin' && role !== 'moderator')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));



    const allowedStatuses = ['pending', 'delivered', 'failed', 'reversed'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();

    const order = await Order.findById(id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (!order.transaction_id.startsWith("#paid")) {
      return NextResponse.json({ error: 'Order place already no need to retry' }, { status: 400 });
    }


    const provider = await Setting.findOne({ key: "provider" }).select("value");

    let orderResponse;

    if (provider?.value === "dakazina") {
      let networkId;
      if (order.network === "MTN") {
        networkId = 3;
      } else if (order.network === "TELECEL") {
        networkId = 2;
      } else if (order.network.startsWith("AT")) {
        networkId = 4;
      } else {
        return NextResponse.json({ message: "Invalid network" }, { status: 400 });
      }

      console.log('Network ID:', networkId);
      if (!networkId) {
        return NextResponse.json({ message: "Invalid network" }, { status: 400 });
      }

      const DAKAZI_API_KEY = process.env.DAKAZI_API_KEY;


      //place order
      const placeOrder = await fetch(
        "https://reseller.dakazinabusinessconsult.com/api/v1/buy-data-package",
        {
          method: "POST",
          headers: {

            "Content-Type": "application/json",
            "x-api-key": `${DAKAZI_API_KEY}`,
          },
          body: JSON.stringify({
            recipient_msisdn: order.phoneNumber.trim(),
            network_id: networkId,
            shared_bundle: Number(order.bundleName),
            incoming_api_ref: order.transaction_id
          })
        }
      );


      const raw = await placeOrder.text();


      let Orderres;
      try {

        Orderres = JSON.parse(raw);
        console.log(Orderres);
        orderResponse = Orderres;

      } catch (error) {
        console.error("Order creation error:", error);
        return NextResponse.json({ message: "Error creating order" }, { status: 500 });
      }

      if (!placeOrder.ok) {

        NextResponse.json({ error: ' could not place an order' })

      }

      if (Orderres.transaction_code) {
        console.log('New order created with id ', Orderres.transaction_code)
        order.transaction_id = Orderres.transaction_code
        order.status = 'placed'
        await order.save()

      }

      console.log('New order created successfully throught dakazina API:', order);

      console.log(' purchase order response:', Orderres)


    } else if (provider?.value === "spendless") {

      const apiKey = process.env.SPENDLESS_API_KEY?.trim();

      if (!apiKey) {
        return NextResponse.json(
          { error: "Spendless API key not configured" },
          { status: 500 }
        );
      }
      let networkKey;
      if (order.network.toUpperCase() == "MTN") {
        networkKey = "YELLO";
      } else if (order.network.toUpperCase() == "TELECEL") {
        networkKey = "TELECEL";
      } else if (order.network.startsWith("AT")) {
        networkKey = "AT_PREMIUM";
      } else {
        return NextResponse.json({ message: "Invalid network" }, { status: 400 });
      }

      const spendlessResponse = await fetch("https://spendless.top/api/purchase", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          networkKey: networkKey,
          recipient: order.phoneNumber.trim(),
          capacity: Number(order.bundleName),
        }),
      });

      const data = await spendlessResponse.json();
      orderResponse = data;
      console.log("spendless order response:", orderResponse);

      if (data.status === "success") {
        order.transaction_id = data.data.transactionReference;
        order.status = "placed";
        await order.save();
      }

    } else if (provider?.value === "datamart") {
      const DATAMART_API_KEY = process.env.DATAMART_API_KEY || process.env.DATA_MART_API_KEY;
      if (!DATAMART_API_KEY) {
        return NextResponse.json(
          { error: "Datamart API key not configured" },
          { status: 500 }
        );
      }
      const data = {
        network: order.network,
        phoneNumber: order.phoneNumber,
        bundleName: order.bundleName,
        reference: order.transaction_id
      };
      orderResponse = await handleDatamart(order, data, DATAMART_API_KEY);
    } else if (provider?.value === "databundleshub" || provider?.value === "dataBundlesHub") {
      const DATABUNDLESHUB_API_KEY = process.env.DATABUNDLESHUB_API_KEY!
      if (!DATABUNDLESHUB_API_KEY) {
        return NextResponse.json(
          { error: "Data Bundles Hub API key not configured" },
          { status: 500 }
        );
      }
      const data = {
        network: order.network,
        phoneNumber: order.phoneNumber,
        bundleName: order.bundleName,
        reference: order.transaction_id
      };
      orderResponse = await handleDataBundlesHub(order, data, DATABUNDLESHUB_API_KEY);
    }



    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}