import tracer from 'dd-trace'
import { version } from '../../package.json'

// eslint-disable-next-line @typescript-eslint/no-var-requires

// initialized in a different file to avoid hoisting.
if (
  process.env['NODE_ENV'] === 'production'
  // Uncomment for non-production testing
  // || process.env['NODE_ENV'] !== 'test'
) {
  const dataDogEnv =
    process.env['NODE_ENV'] === 'production' ? 'production' : 'development'

  tracer.init({
    // Docs: https://docs.datadoghq.com/tracing/trace_collection/library_config/nodejs/
    // Setup
    env: dataDogEnv,
    service: 'contag',
    version: version,

    // Settings
    appsec: false, // could not get this to work on heroku
    dbmPropagationMode: 'full',
    logInjection: true,
    logLevel: 'error',
    plugins: true,
    profiling: true,
    runtimeMetrics: true,
    sampleRate: 20,
  })
}
export default tracer
