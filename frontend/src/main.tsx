import React from 'react'
import ReactDOM from 'react-dom/client'
import createApp from './createApp'
import { CssBaseline } from '@contag/ui'
import { datadogRum } from '@datadog/browser-rum'
import { datadogLogs } from '@datadog/browser-logs'
import { version } from '../../package.json'

if (
  process.env.NODE_ENV === 'production'
  // Uncomment for non-production testing
  // || process.env['NODE_ENV'] !== 'test'
) {
  const dataDogClientToken = 'pubc598a3e6b38d148b7a27fac22cf9eb13'
  const dataDogEnv = process.env.NODE_ENV
  const dataDogService = 'contag'
  const dataDogSite = 'us5.datadoghq.com'

  datadogRum.init({
    // Docs: https://docs.datadoghq.com/real_user_monitoring/browser/#initialization-parameters
    // Setup
    applicationId: '4c92d7cb-4e6f-45fb-aeff-002a3ada9280',
    clientToken: dataDogClientToken,
    site: dataDogSite,
    service: dataDogService,
    env: dataDogEnv,
    version: version,

    // Settings:
    defaultPrivacyLevel: 'mask',
    enableExperimentalFeatures: ['clickmap'],
    sessionSampleRate: 100,
    sessionReplaySampleRate: 100,
    telemetrySampleRate: 20, // TODO: reduce to at most 20 to reduce costs
    trackFrustrations: true,
    trackLongTasks: true,
    trackResources: true,
    trackUserInteractions: true,
    useSecureSessionCookie: true, // NB: this must match the setting in dataDogLogs
    allowedTracingUrls: [
      'https://contagapp.com',
      'http://localhost',
      'https://contagapp.com/api',
    ], //docs.datadoghq.com/real_user_monitoring/connect_rum_and_traces/?tab=browserrum#setup-rum
    traceSampleRate: 20,
  })

  datadogRum.startSessionReplayRecording()

  datadogLogs.init({
    // Docs: https://docs.datadoghq.com/logs/log_collection/javascript/#initialization-parameters
    // Setup
    clientToken: dataDogClientToken,
    site: dataDogSite,
    service: dataDogService,
    env: dataDogEnv,
    version: version,

    // Settings
    forwardConsoleLogs: ['warn', 'error'],
    forwardErrorsToLogs: true,
    forwardReports: 'all', // https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API
    sessionSampleRate: 100,
    telemetrySampleRate: 20,
    useSecureSessionCookie: true, // NB: this must match the setting in dataDogRum
  })
}

const main = async () => {
  const { App } = await createApp()

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <CssBaseline />
      <App />
    </React.StrictMode>
  )
}

if (process.env.IS_DEV_MODE === 'true') {
  const title = document.querySelector('title')

  if (title) {
    title.textContent = `dev - ${title.textContent}`
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
  })
}

// HACK: fixes blank page after new version is released and you reopen the app by forcefully reloading. Source and explanation: https://redfin.engineering/how-to-fix-the-refresh-button-when-using-service-workers-a8e27af6df68
let refreshing: boolean
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})

main()
