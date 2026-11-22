import mongoose, { Schema, Model } from 'mongoose';

export interface IOrder {
    _id: mongoose.Types.ObjectId;
    user?: mongoose.Types.ObjectId; // Optional — guests have no user ID
    agent?: mongoose.Types.ObjectId;
    transaction_id: string;
    bundleName: string;
    network: string;
    price: number;
    originalPrice?: number;
    phoneNumber: string;
    payment_id: string;

    status: 'pending' | 'delivered' | 'failed' | 'reversed' | 'processing' | 'placed';
    transactionId?: string; // External or generated ID
    createdAt: Date;
    updatedAt: Date;
}
const OrderSchema = new Schema<IOrder>( 
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        transaction_id: { type: String, required: true, unique: true },
        bundleName: { type: String, required: true },
        network: { type: String, required: true },
        price: { type: Number, required: true },
        phoneNumber: { type: String, required: true },
        agent: { type: Schema.Types.ObjectId, ref: 'User', required: false },
        originalPrice: { type: Number, required: false },
        payment_id: { type: String, required: true, unique: true },
        status: {
            type: String,
            enum: ['pending', 'delivered', 'failed','placed', 'reversed', 'processing'],
            default: 'processing'
        },
        transactionId: { type: String },
    },
    { timestamps: true }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
