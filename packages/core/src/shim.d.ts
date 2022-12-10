import type { Options } from './type'

declare global {
  interface Window {
    /** version number */
    pluginWebUpdateNotice_version: string
    pluginWebUpdateNotice_: {
      locale?: string;
      /** set language */
      setLocale: (locale: string) => void
      /** check update */
      checkUpdate: (options: Options) => void
    }
  }
}