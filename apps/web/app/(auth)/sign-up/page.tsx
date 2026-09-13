import { AuthForm } from "@/components/auth-form";
import { enabledSocialProviders } from "@kettleworth/api/auth";
export const metadata = { title: "Create account" };
export default function SignUp() { return <AuthForm mode="sign-up" providers={enabledSocialProviders()} />; }
