export async function handleDakazina(order: any, data: any, apiKey: string) {
  let networkId;

  if (data.network === "MTN") networkId = 3;
  else if (data.network === "TELECEL") networkId = 2;
  else if (data.network.startsWith("AT")) networkId = 4;
  else throw new Error("Invalid network");

  const res = await fetch(
    "https://reseller.dakazinabusinessconsult.com/api/v1/buy-data-package",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        recipient_msisdn: data.phoneNumber.trim(),
        network_id: networkId,
        shared_bundle: Number(data.bundleName),
        incoming_api_ref: data.reference,
      }),
    }
  );

  const result = await res.json();

  if (result.transaction_code) {
    order.transaction_id = result.transaction_code;
    order.status = "processing";
    await order.save();
  }
    console.log('Dakazina result:', result);
  return result;

}



export async function handleSpendless(order: any, data: any, apiKey: string) {
  let networkKey;

  if (data.network.toUpperCase() === "MTN") networkKey = "YELLO";
  else if (data.network.toUpperCase() === "TELECEL") networkKey = "TELECEL";
  else if (data.network.toUpperCase().startsWith("AT")) networkKey = "AT_PREMIUM";
  else throw new Error("Invalid network");

  const res = await fetch("https://spendless.top/api/purchase", {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      networkKey,
      recipient: data.phoneNumber.trim(),
      capacity: Number(data.bundleName),
    }),
  });

  const result = await res.json();

  if (result.status === "success") {
    order.transaction_id = result.data.transactionReference;
    order.status = "processing";
    await order.save();
  }
    console.log('Spendless result:', result);
  return result;
}

export async function handleDatamart(order: any, data: any, apiKey: string) {


  let networkKey;

  if (data.network.toUpperCase() === "MTN") networkKey = "YELLO";
  else if (data.network.toUpperCase() === "TELECEL") networkKey = "TELECEL";
  else if (data.network.toUpperCase().startsWith("AT")) networkKey = "AT_PREMIUM";
  else throw new Error("Invalid network");
 try{
  const res = await fetch("https://api.datamartgh.shop/api/developer/purchase", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      network: networkKey,
      phoneNumber: data.phoneNumber.trim(),
      capacity: Number(data.bundleName),
      gateway: "wallet"
    }),
  });

  const result = await res.json();
  console.log("Datamart result", result)

  if (result.status === "success" || result.transaction_id) {
    order.transaction_id = result.data?.transactionReference || result.transaction_id || result.transaction_code || `datamart_${Date.now()}`;
    order.status = "processing";
    await order.save();
  }
  console.log('Datamart result:', result);
  return result;
} catch(error){
  console.log(error)
 }
}