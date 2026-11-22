import mongoose, { Schema, Model } from 'mongoose';

export interface IBundle {
    _id: mongoose.Types.ObjectId;
    network: 'MTN' | 'Telecel' | 'AirtelTigo';
    name: string; // e.g. "1GB", "2.5GB"
    sizeValue: number; // Value in MB for sorting/calc if needed, e.g. 1024
    price: number;
    isActive: boolean;
    audience: 'user' | 'agent' | 'promo';
    createdAt: Date;
    updatedAt: Date;
}

const BundleSchema = new Schema<IBundle>(
    {
        network: { type: String, enum: ['MTN', 'Telecel', 'AirtelTigo'], required: true },
        name: { type: String, required: true },
        sizeValue: { type: Number, default: 0 },
        price: { type: Number, required: true },
        isActive: { type: Boolean, default: true },
        audience: { type: String, enum: ['user', 'agent', 'promo'], default: 'user' },
    },
    { timestamps: true }
);

const Bundle: Model<IBundle> = mongoose.models.Bundle || mongoose.model<IBundle>('Bundle', BundleSchema);

export default Bundle;
