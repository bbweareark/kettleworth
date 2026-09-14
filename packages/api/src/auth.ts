import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db, user, session, account, verification } from "@kettleworth/db";
import { sendEmail } from "./email";

const socialProviders: Record<string, { clientId: string; clientSecret: string }> = {};
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) socialProviders.google = { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET };
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) socialProviders.apple = { clientId: process.env.APPLE_CLIENT_ID, clientSecret: process.env.APPLE_CLIENT_SECRET };

export const auth = betterAuth({
  appName: "Kettleworth",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db(), { provider: "pg", schema: { user, session, account, verification } }),
  emailAndPassword: { enabled: true, minPasswordLength: 10, autoSignIn: true },
  socialProviders,
  session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 5 * 60 } },
  advanced: { cookiePrefix: "kw", useSecureCookies: process.env.NODE_ENV === "production" },
  rateLimit: { enabled: true, window: 60, max: 30 },
  plugins: [
    magicLink({
      expiresIn: 60 * 15,
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({ to: email, subject: "Your Kettleworth sign-in link", text: `Sign in to Kettleworth:\n\n${url}\n\nThis link expires in 15 minutes. If you didn't request it, ignore this email.`, html: `<p>Sign in to <strong>Kettleworth</strong>:</p><p><a href="${url}" style="display:inline-block;padding:12px 20px;background:#c9a97a;color:#131211;border-radius:10px;text-decoration:none;font-weight:600">Sign in</a></p><p style="color:#777">This link expires in 15 minutes. If you didn't request it, ignore this email.</p>` });
      },
    }),
  ],
});
export type Auth = typeof auth;
export const enabledSocialProviders = () => Object.keys(socialProviders);
