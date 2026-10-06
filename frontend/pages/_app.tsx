import "@/styles/globals.css";
import type {AppProps} from "next/app";
import Head from "next/head";
import {type NextRouter, useRouter} from "next/router";
import {QueryClientProvider} from "@tanstack/react-query";
import {HeroUIProvider} from "@heroui/react";
import {ToastProvider} from "@heroui/react";
import {ThemeProvider as NextThemesProvider} from "next-themes";
import {queryClient} from "@/lib/queryClient";
import AuthProvider from "@/components/auth/AuthProvider";
import NavBar from "@/components/NavBar";

declare module "@react-types/shared" {
    interface RouterConfig {
        routerOptions: NonNullable<
            Parameters<NextRouter['push']>[2]
        >;
    }
}

export default function App({Component, pageProps}: AppProps) {
    const router = useRouter();

    return (
        <HeroUIProvider
            navigate={(path, routerOptions) => {
                void router.push(path, undefined, routerOptions);
            }}
        >
            <QueryClientProvider client={queryClient}>
                <Head>
                    <meta name="viewport" content="initial-scale=1, maximum-scale=1"/>
                </Head>
                <ToastProvider
                    placement="bottom-center"
                    toastProps={{
                        variant: "bordered"
                    }}
                />
                <NextThemesProvider attribute="class" defaultTheme="dark">
                    <AuthProvider>
                        <NavBar/>
                        <Component {...pageProps} />
                    </AuthProvider>
                </NextThemesProvider>
            </QueryClientProvider>
        </HeroUIProvider>
    );
}
