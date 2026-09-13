import { AuthForm } from "@/components/auth-form";
import { enabledSocialProviders } from "@kettleworth/api/auth";
export const metadata = { title: "Sign in" };
export default function SignIn() { return <AuthForm mode="sign-in" providers={enabledSocialProviders()} />; }
