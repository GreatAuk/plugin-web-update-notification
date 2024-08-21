# Custom Events

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