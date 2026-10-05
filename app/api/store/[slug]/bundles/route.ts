import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import AgentStore from '@/models/AgentStore';
import Bundle from '@/models/Bundle';
import StoreBundle from '@/models/StoreBundle';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
    try {
        await dbConnect();

        const slug = (await params).slug;

        const store = await AgentStore.findOne({ slug, isActive: true })
            .populate('user', 'phone')
            .select('storeName description user');
            
        if (!store) {
            return NextResponse.json({ error: 'Store not found' }, { status: 404 });
        }

        // Format agent phone to international format for WhatsApp
        let agentPhone = "233509352247"; // default fallback
        const storeUser = store.user as any; // Cast to any to bypass TS ObjectId type restriction
        
        if (storeUser && storeUser.phone) {
            let cleanPhone = storeUser.phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
                agentPhone = '233' + cleanPhone.slice(1);
            } else if (cleanPhone.length > 0) {
                agentPhone = cleanPhone;
            }
        }

        // Fetch all available bundles for agents
        const bundles = await Bundle.find({ isActive: true, audience: 'agent' });
        
        // Fetch custom prices for this agent
        const agentCustomBundles = await StoreBundle.find({ agent: store.user });

        // Apply agent profit markup from StoreBundle
        const storeBundles = bundles.map(bundle => {
            const customBundle = agentCustomBundles.find(cb => cb.bundle.toString() === bundle._id.toString());
            
            // If we have a custom price, use it to calculate profit
            // Otherwise profit is 0
            const finalPrice = customBundle ? customBundle.customPrice : bundle.price;
            const agentProfit = finalPrice - bundle.price;

            return {
                _id: bundle._id,
                name: bundle.name,
                network: bundle.network,
                originalPrice: bundle.price,
                profit: agentProfit,
                price: finalPrice,
                audience: bundle.audience,
                storeId: store._id
            };
        });

        return NextResponse.json({
            storeName: store.storeName,
            description: store.description,
            bundles: storeBundles,
            agentId: store.user._id,
            agentPhone: agentPhone
        });
    } catch (error) {
        console.error('Fetch store bundles error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
