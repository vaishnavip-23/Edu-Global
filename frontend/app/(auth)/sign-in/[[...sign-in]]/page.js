import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10 dark:bg-black">
      <SignIn
        appearance={{
          layout: {
            logoPlacement: "inside",
            socialButtonsPlacement: "bottom",
          },
        }}
        localization={{
          signIn: {
            start: {
              title: "Log in",
            },
          },
        }}
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        forceRedirectUrl="/onboarding"
      />
    </main>
  );
}

