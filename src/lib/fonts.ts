import { JetBrains_Mono } from "next/font/google";

/** Mono face for the lab/"certificate" details on the home page (the live site loads it too). */
export const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});
