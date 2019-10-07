import React from 'react'
import App from 'next/app'
import Head from 'next/head'
import CssBaseline from '@material-ui/core/CssBaseline'
import { SnackbarProvider } from 'notistack'

export default class MyApp extends App {
  componentDidMount(): void {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles !== null && jssStyles.parentNode !== null) {
      jssStyles.parentNode.removeChild(jssStyles)
    }
  }

  render(): React.ReactElement {
    const { Component, pageProps } = this.props

    return (
      <React.Fragment>
        <Head>
          <title>Web Authentication</title>
        </Head>
        <SnackbarProvider>
          <CssBaseline />
          <Component {...pageProps} />
        </SnackbarProvider>
      </React.Fragment>
    )
  }
}
