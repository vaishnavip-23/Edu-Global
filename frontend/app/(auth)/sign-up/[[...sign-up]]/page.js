import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-10 dark:bg-stone-950">
      <SignUp
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
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl="/onboarding"
      />
    </main>
  );
}
