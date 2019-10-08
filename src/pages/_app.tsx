import React, { FunctionComponent } from 'react'
import App from 'next/app'
import Head from 'next/head'
import CssBaseline from '@material-ui/core/CssBaseline'
import IconButton from '@material-ui/core/IconButton'
import CloseIcon from '@material-ui/icons/Close'
import { SnackbarProvider, useSnackbar } from 'notistack'

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
        <SnackbarProvider
          anchorOrigin={{ horizontal: 'center', vertical: 'top' }}
          action={key => <SnackbarCloseButton key={key} />}
        >
          <CssBaseline />
          <Component {...pageProps} />
        </SnackbarProvider>
      </React.Fragment>
    )
  }
}

interface SnackbarCloseButtonProps {
  key?: string | number
}

const SnackbarCloseButton: FunctionComponent<SnackbarCloseButtonProps> = ({ key }) => {
  const { closeSnackbar } = useSnackbar()

  return (
    <IconButton onClick={() => closeSnackbar(key)}>
      <CloseIcon />
    </IconButton>
  )
}
