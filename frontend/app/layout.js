import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "./components/Navbar";

export const metadata = {
  title: "EduGlobal",
  description:
    "Your AI Counsellor for study abroad. Plan your study-abroad journey with guided AI counselling and personalized university recommendations.",
  icons: { icon: "/icon.png" },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/onboarding"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="en">
        <body className="antialiased">
          <Navbar />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
