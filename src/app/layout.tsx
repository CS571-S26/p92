import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/Header";
import { TrpcProvider } from "@/components/providers";

export const metadata: Metadata = {
  title: "Skinshi",
  description: "Bet your skins on real world events!",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TrpcProvider>
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
        </TrpcProvider>
      </body>
    </html>
  );
}
