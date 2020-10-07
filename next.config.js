/* eslint-disable @typescript-eslint/no-var-requires */
const nextTranspileModules = require('next-transpile-modules')

// Transpile the @github/webauthn-json package using Babel because it only has an ES module
// entrypoint which breaks the Next.js server-side build
const withTranspileModules = nextTranspileModules(['@github/webauthn-json'])

module.exports = withTranspileModules({
  poweredByHeader: false,
})
