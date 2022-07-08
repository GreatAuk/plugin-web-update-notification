interface Window {
  /** web update event */
  system_update_event_vite_plugin: Event
  /** git commit hash or packaging time */
  web_version_by_plugin: string
  /** 是否已经显示了系统升级 notification */
  hasShowSystemUpdateNotice_plugin?: boolean
  webUpdateCheck_checkAndNotice: (any) => void
}
