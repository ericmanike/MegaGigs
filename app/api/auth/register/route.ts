import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { authOptions } from "@/lib/auth";
import { verifyTurnstileToken } from "@/lib/turnstile";

export async function POST(req: Request) {
    try {
        const { name, email, password, phone, turnstileToken } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        if (process.env.TURNSTILE_SECRET_KEY) {
            if (!turnstileToken) {
                return NextResponse.json(
                    { message: "Security verification required" },
                    { status: 400 }
                );
            }

            const isValid = await verifyTurnstileToken(turnstileToken);
            if (!isValid) {
                return NextResponse.json(
                    { message: "Security verification failed. Please try again." },
                    { status: 400 }
                );
            }
        }

        await dbConnect();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "User already exists" },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
        });

        return NextResponse.json(
            { message: "User created successfully", user: { id: user._id, name: user.name, email: user.email } },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { message: "An error occurred while registering the user." },
            { status: 500 }
        );
    }
}
