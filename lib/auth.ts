import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from './mongoose';
import User from '@/models/User';
import { verifyTurnstileToken } from './turnstile';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                turnstileToken: { label: 'Turnstile Token', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password');
                }

                if (process.env.TURNSTILE_SECRET_KEY && credentials?.turnstileToken) {
                    const isValid = await verifyTurnstileToken(credentials.turnstileToken);
                    if (!isValid) {
                        throw new Error('Security verification failed. Please try again.');
                    }
                }

                await dbConnect();
                const user = await User.findOne({ email: credentials.email }).select('+password');

                if (!user) {
                    throw new Error('No user found with this email');
                }

                const isValid = await bcrypt.compare(credentials.password, user.password!);

                if (!isValid) {
                    throw new Error('Incorrect password');
                }

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                if (!user.email) {
                    return false;
                }

                await dbConnect();
                try {
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        const newUser = await User.create({
                            name: user.name || 'Google User',
                            email: user.email,
                            role: 'user',
                            walletBalance: 0,
                        }) as any;
                        user.id = newUser._id.toString();
                        (user as any).role = newUser.role;
                    } else {
                        user.id = (existingUser as any)._id.toString();
                        (user as any).role = (existingUser as any).role;
                    }
                    return true;
                } catch (error) {
                    console.error('Error during Google sign-in:', error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }

            // Support for updating the session securely from the DB
            if (trigger === "update") {
                await dbConnect();
                const dbUser = await User.findById(token.id);
                if (dbUser) {
                    token.role = dbUser.role;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/auth/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 60 * 60 * 8, // 5 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    debug: false,
};
 

