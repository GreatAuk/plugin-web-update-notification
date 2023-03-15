import type { Options } from './type'

declare global {
  interface Window {
    /** version number */
    pluginWebUpdateNotice_version: string
    /**
     * don't call this function in manual。
     */
    __checkUpdateSetup__: (options: Options) => void
    pluginWebUpdateNotice_: {
      locale?: string;
      /**
       * set language.
       * preset: zh_CN、zh_TW、en_US
      */
      setLocale: (locale: string) => void
      /**
       * manual check update, a function wrap by debounce(5000ms)
       */
      checkUpdate: () => void
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
  interface GlobalEventHandlersEventMap {
    plugin_web_update_notice: CustomEvent<{ version: string; options: Options }>;
  }
}