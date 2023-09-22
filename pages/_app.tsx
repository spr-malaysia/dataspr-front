import Nexti18NextConfig from "../next-i18next.config";
import "../styles/globals.css";
import Layout from "@components/Layout";
import Progress from "@components/Progress";
import { header, body } from "@lib/configs/font";
import mixpanelConfig from "@lib/configs/mixpanel";
import { clx } from "@lib/helpers";
import { ga_track, track } from "@lib/mixpanel";
import { AppPropsLayout } from "@lib/types";
import { appWithTranslation } from "next-i18next";
import { ThemeProvider } from "next-themes";
import { useRouter } from "next/router";
import { useEffect, ReactNode } from "react";

// App instance
function App({ Component, pageProps }: AppPropsLayout) {
  const layout =
    Component.layout ||
    ((page: ReactNode) => (
      <Layout className={clx(body.variable, "font-sans")}>{page}</Layout>
    ));
  // const router = useRouter();

  // Mixpanel initialisation
  useEffect(() => {
    const is_development = process.env.NEXT_PUBLIC_APP_ENV === "development";
    window.mixpanel.init(
      mixpanelConfig.token,
      {
        debug: is_development,
        verbose: is_development,
        api_host: mixpanelConfig.host,
      },
      mixpanelConfig.name
    );
  }, []);

  // useEffect(() => {
  //   // trigger page view event for client-side navigation
  //   const handleRouteChange = (url: string) => {
  //     ga_track(url);
  //     track("page_view", pageProps?.meta);
  //   };
  //   router.events.on("routeChangeComplete", handleRouteChange);
  //   return () => {
  //     router.events.off("routeChangeComplete", handleRouteChange);
  //   };
  // }, [router.events, pageProps?.meta]);

  return (
    <div
      className={clx(
        body.variable,
        header.variable,
        "font-sans dark:bg-zinc-900"
      )}
    >
      <ThemeProvider
        attribute="class"
        enableSystem={false}
        forcedTheme={Component.theme}
      >
        {layout(<Component {...pageProps} />, pageProps)}
        <Progress />
      </ThemeProvider>
    </div>
  );
}

export default appWithTranslation(App, Nexti18NextConfig);
