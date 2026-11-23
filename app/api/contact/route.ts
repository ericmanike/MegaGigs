import { NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyTurnstileToken } from "@/lib/turnstile";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message, turnstileToken } = body;

        if (!name || !email || !message) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (process.env.TURNSTILE_SECRET_KEY) {
            if (!turnstileToken) {
                return NextResponse.json(
                    { error: "Security verification required" },
                    { status: 400 }
                );
            }

            const isValid = await verifyTurnstileToken(turnstileToken);
            if (!isValid) {
                return NextResponse.json(
                    { error: "Security verification failed. Please try again." },
                    { status: 400 }
                );
            }
        }

        const { data, error } = await resend.emails.send({
            from: `MegaGigs Contact <${process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"}>`,
            to: ["manikeeric@gmail.com"],
            subject: `New Contact Form Submission from ${name}`,
           
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #1a1a1a; margin-top: 0;">New Contact Message</h2>
                    <p style="margin-bottom: 20px; color: #666;">You have received a new message from your website contact form.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                    </div>

                    <div style="padding: 15px; border-left: 4px solid #1a1a1a; background-color: #f4f4f4;">
                        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>

                    <p style="font-size: 12px; color: #999; margin-top: 30px; text-align: center;">
                        This email was sent from the MegaGigs contact form.
                    </p>
                </div>
            `,
        });

        if (error) {
            return NextResponse.json({ error }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("Resend error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
