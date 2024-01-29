const browserEsmOnlyPackages = [
  'firebase',
  '@firebase/auth',
  '@firebase/util',
  '@firebase/storage',
]

module.exports = (path, options) => {
  return options.defaultResolver(path, {
    ...options,
    packageFilter: (pkg) => {
      // jest-environment-jsdom 28+ tries to use browser exports instead of default exports,
      // but some packages only offers an ESM browser export and not a CommonJS one. Jest does not yet
      // support ESM modules natively, so this causes a Jest error related to trying to parse
      // "export" syntax.
      //
      // This workaround prevents Jest from considering packages module-based exports at all;
      // it falls back to the package's CommonJS+node "main" property.
      if (browserEsmOnlyPackages.includes(pkg.name)) {
        delete pkg.exports
        delete pkg.module
        delete pkg.browser
      }

      return pkg
    },
  })
}
