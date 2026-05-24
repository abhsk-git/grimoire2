import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif, Rajdhani, Space_Grotesk, Sora, DM_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { RealmProvider } from "@/lib/realm";
import { SettingsProvider } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Grimoire — a quiet writing tool with a memory",
  description:
    "Save links. Write essays. Build the archive your future self will want to inherit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${rajdhani.variable} ${spaceGrotesk.variable} ${sora.variable} ${dmSans.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('grimoire-theme')||'light';document.documentElement.setAttribute('data-theme',t);var r=localStorage.getItem('grimoire-realm');if(r&&r!=='default')document.documentElement.setAttribute('data-realm',r);}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>
            <RealmProvider>
              <SettingsProvider>
                {children}
              </SettingsProvider>
            </RealmProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
