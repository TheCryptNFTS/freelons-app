import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "FREELONS",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "freelons-local",
  chains: [mainnet],
  ssr: true,
});
