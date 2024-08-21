# API

## webUpdateNotice Options

````ts
function webUpdateNotice(options?: Options): Plugin;

export interface Options {
  /**
   * support 'git_commit_hash' | 'svn_revision_number' | 'pkg_version' | 'build_timestamp' | 'custom'
   * * if repository type is 'Git', default is 'git_commit_hash'
   * * if repository type is 'SVN', default is 'svn_revision_number'
   * * if repository type is 'unknown', default is 'build_timestamp'
   * */
  versionType?: VersionType;
  /**
   * custom version, if versionType is 'custom', this option is required
   */
  customVersion?: string;
  /** polling interval（ms）
   * if set to 0, it will not polling
   * @default 10 * 60 * 1000
   */
  checkInterval?: number;
  /**
   * check update when window focus
   * @default true
   */
  checkOnWindowFocus?: boolean;
  /**
   * check update immediately after page loaded
   * @default true
   */
  checkImmediately?: boolean;
  /**
   * check update when load js file error
   * @default true
   */
  checkOnLoadFileError?: boolean;
  /**
   * whether to output version in console
   *
   * you can also pass a function to handle the version
   * ```ts
   * logVersion: (version) => {
   *  console.log(`version: %c${version}`, 'color: #1890ff') // this is the default behavior
   * }
   * ```
   * @default true
   */
  logVersion?: boolean | ((version: string) => void);
  /**
   * whether to silence the notification.
   * such as when local version is v1.0, you can set this option to true and build a new version v1.0.1, then the notification will not show
   */
  silence?: boolean;
  /**
   * @deprecated
   */
  customNotificationHTML?: string;
  /** notificationProps have higher priority than locale */
  notificationProps?: NotificationProps;
  notificationConfig?: NotificationConfig;
  /**
   * preset: zh_CN | zh_TW | en_US
   * @default 'zh_CN'
   * */
  locale?: string;
  /**
   * custom locale data
   * @link default data: https://github.com/GreatAuk/plugin-web-update-notification/blob/master/packages/core/src/locale.ts
   */
  localeData?: LocaleData;
  /**
   * Whether to hide the default notification, if you set it to true, you need to custom behavior by yourself
   * ```ts
    document.body.addEventListener('plugin_web_update_notice', (e) => {
      const { version, options } = e.detail
      // write some code, show your custom notification and etc.
      alert('System update!')
    })
   * ```
   * @default false
   */
  hiddenDefaultNotification?: boolean;
  /**
   * Whether to hide the dismiss button
   * @default false
   */
  hiddenDismissButton?: boolean;
  /**
   * After version 1.2.0, you not need to set this option, it will be automatically detected from the base of vite config、publicPath of webpack config or publicPath of umi config
   *
   * Base public path for inject file, Valid values include:
   * * Absolute URL pathname, e.g. /foo/
   * * Full URL, e.g. https://foo.com/
   * * Empty string(default) or ./
   *
   * !!! Don't forget / at the end of the path
   */
  injectFileBase?: string;
}

export type VersionType =
  | "git_commit_hash"
  | "pkg_version"
  | "build_timestamp"
  | "custom";

export interface NotificationConfig {
  /**
   * refresh button color
   * @default '#1677ff'
   */
  primaryColor?: string;
  /**
   * dismiss button color
   * @default 'rgba(0,0,0,.25)'
   */
  secondaryColor?: string;
  /** @default 'bottomRight' */
  placement?: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

export interface NotificationProps {
  title?: string;
  description?: string;
  /** refresh button text */
  buttonText?: string;
  /** dismiss button text */
  dismissButtonText?: string;
}

export type LocaleData = Record<string, NotificationProps>;
````

## export Functions

| name                                             | params                              | describe                                                                      |
| ------------------------------------------------ | ----------------------------------- | ----------------------------------------------------------------------------- |
| window.pluginWebUpdateNotice\_.setLocale         | locale(preset: zh_CN、zh_TW、en_US) | set locale                                                                    |
| window.pluginWebUpdateNotice\_.closeNotification |                                     | close notification                                                            |
| window.pluginWebUpdateNotice\_.dismissUpdate     |                                     | dismiss current update and close notification,same behavior as dismiss button |
| window.pluginWebUpdateNotice\_.checkUpdate       |                                     | manual check update, a function wrap by debounce(5000ms)                      |

```ts
interface Window {
  pluginWebUpdateNotice_: {
    /**
     * set language.
     * preset: zh_CN、zh_TW、en_US
     */
    setLocale: (locale: string) => void;
    /**
     * manual check update, a function wrap by debounce(5000ms)
     */
    checkUpdate: () => void;
    /** dismiss current update and close notification, same behavior as dismiss the button */
    dismissUpdate: () => void;
    /** close notification */
    closeNotification: () => void;
    /**
     * refresh button click event, if you set it, it will cover the default event (location.reload())
     */
    onClickRefresh?: (version: string) => void;
    /**
     * dismiss button click event, if you set it, it will cover the default event (dismissUpdate())
     */
    onClickDismiss?: (version: string) => void;
  };
}
```
