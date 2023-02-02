import type { Options } from './type'

declare global {
  interface Window {
    /** version number */
    pluginWebUpdateNotice_version: string
    pluginWebUpdateNotice_: {
      locale?: string;
      /** set language */
      setLocale: (locale: string) => void
      checkUpdate: (options: Options) => void
      /** dismiss current update and close notification, same behavior as dismiss the button */
      dismissUpdate: () => void
      /** close notification */
      closeNotification: () => void
      /**
       * refresh button click event, if you set it, it will cover the default event (location.reload())
       */
      onClickRefresh?: (version: string) => void
      /**
       * dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
       */
      onClickDismiss?: (version: string) => void
    }
  }
}