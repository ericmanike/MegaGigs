export async function verifyTurnstileToken(token?: string | null): Promise<boolean> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) {
        return true;
    }
    if (!token) {
        return false;
    }

    try {
        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", token);

        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
            method: "POST",
            body: formData,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const data = await res.json();
        if (!data.success) {
            console.error("Turnstile verification failed:", data);
        }
        return data.success === true;
    } catch (error) {
        console.error("Turnstile verification error:", error);
        return false;
    }
}
