import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/context/themeContext";
import { NotificationsProvider } from "@/context/notificationsContext";
import { AuthProvider } from "@/context/authContext";
import { RealtimeProvider } from "@/context/realtimeContext";
import RouteGuard from "@/components/auth/route-guard";
import { Toaster } from "@/components/ui/toast";

const foundersGrotesk = localFont({
  src: "../../public/fonts/FoundersGrotesk-Regular.otf",
  variable: "--font-founders-grotesk",
  display: "swap",
});


export const metadata = {
  title: "Iris",
  description: "Chat app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${foundersGrotesk.variable} antialiased`}
      >
        <ThemeProvider>
          <NotificationsProvider>
            <AuthProvider>
              <RealtimeProvider>
                <RouteGuard>
                  {children}
                  <Toaster />
                </RouteGuard>
              </RealtimeProvider>
            </AuthProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
