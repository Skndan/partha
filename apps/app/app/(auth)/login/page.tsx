import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  return <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col p-6 md:p-10">
      <div className="flex flex-1 items-center justify-center py-8">
        <LoginForm className="px-1 sm:px-0" />
      </div>
    </div>
    <div className="relative hidden bg-muted lg:block">
      <img
        src="/placeholder.svg"
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>;
}

