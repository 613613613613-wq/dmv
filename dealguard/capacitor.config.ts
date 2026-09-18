import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shlomo.dealguard",
  appName: "Deal Guard",
  webDir: "dist",
  backgroundColor: "#07090d",
  ios: {
    contentInset: "never",
    backgroundColor: "#07090d",
    preferredContentMode: "mobile",
  },
  android: {
    backgroundColor: "#07090d",
    allowMixedContent: false,
    // Companion mode talks to a desktop daemon over plain ws:// on the LAN.
    // Cleartext is scoped by android/app/src/main/res/xml/network_security_config.xml.
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#07090d",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#07090d",
      overlaysWebView: false,
    },
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;
