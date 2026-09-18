/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RC_IOS_KEY?: string;
  readonly VITE_RC_ANDROID_KEY?: string;
  /** Set to "1" by the e2e runner to enable the mock purchase provider on the web. */
  readonly VITE_E2E?: string;
}
