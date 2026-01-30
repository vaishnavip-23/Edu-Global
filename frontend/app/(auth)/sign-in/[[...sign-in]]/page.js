import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 dark:bg-stone-950">
      <SignIn
        appearance={{
          layout: {
            logoPlacement: "inside",
            socialButtonsPlacement: "bottom",
          },
          variables: {
            colorPrimary: "#ea580c",
            borderRadius: "0.75rem",
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
