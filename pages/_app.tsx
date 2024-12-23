import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import NavBar from "@/components/NavBar";

export default function App({ Component, pageProps }: AppProps) {

  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <NavBar />
        <Component {...pageProps} />
      </NextThemesProvider>
    </NextUIProvider>
  );
}
