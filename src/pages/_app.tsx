import React, { FunctionComponent } from 'react'
import App from 'next/app'
import Head from 'next/head'
import { CssBaseline, IconButton } from '@material-ui/core'
import { Close as CloseIcon } from '@material-ui/icons'
import { SnackbarProvider, useSnackbar } from 'notistack'

export default class MyApp extends App {
  componentDidMount(): void {
    // Remove the server-side injected CSS.
    const jssStyles = document.querySelector('#jss-server-side')
    if (jssStyles?.parentNode) {
      jssStyles.parentNode.removeChild(jssStyles)
    }
  }

  render(): React.ReactElement {
    const { Component, pageProps } = this.props

    return (
      <>
        <Head>
          <title>Web Authentication Demo</title>
        </Head>
        <SnackbarProvider action={(snackbarKey) => <SnackbarCloseButton snackbarKey={snackbarKey} />}>
          <CssBaseline />
          <Component {...pageProps} />
        </SnackbarProvider>
      </>
    )
  }
}

interface SnackbarCloseButtonProps {
  snackbarKey?: string | number
}

const SnackbarCloseButton: FunctionComponent<SnackbarCloseButtonProps> = ({ snackbarKey }) => {
  const { closeSnackbar } = useSnackbar()

  return (
    <IconButton onClick={() => closeSnackbar(snackbarKey)}>
      <CloseIcon />
    </IconButton>
  )
}
