import React, { useCallback, useState } from 'react'
import { NextPage } from 'next'
import { Button, AppBar, Typography, Toolbar, Paper, TextField, makeStyles, Box } from '@material-ui/core'
import { useSnackbar } from 'notistack'
import register from '../client/register'
import login from '../client/login'
import getSession from '../client/get-session'
import logout from '../client/logout'

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexWrap: 'wrap',
    margin: '16px',
  },
  form: {
    minWidth: '300px',
    padding: '16px',
    margin: '8px',
  },
  input: {
    marginBottom: '16px',
  },
})

interface HomeProps {
  userEmail?: string
}

const Home: NextPage<HomeProps> = (props) => {
  const [userEmail, setUserEmail] = useState(props.userEmail)
  const [registerEmail, setRegisterEmail] = useState('')
  const [loginEmail, setLoginEmail] = useState('')
  const { enqueueSnackbar } = useSnackbar()
  const css = useStyles()

  const handleRegisterEmailChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((e) => {
    setRegisterEmail(e.target.value)
  }, [])

  const registerCallback = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault()

      register(registerEmail)
        .then(() => {
          setUserEmail(registerEmail)
          enqueueSnackbar('Register success', { variant: 'success' })
        })
        .catch((error) => {
          enqueueSnackbar(error.message, { variant: 'error' })
        })
    },
    [enqueueSnackbar, registerEmail]
  )

  const handleLoginEmailChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>((e) => {
    setLoginEmail(e.target.value)
  }, [])

  const loginCallback = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault()

      login(loginEmail)
        .then(() => {
          setUserEmail(loginEmail)
          enqueueSnackbar('Login success', { variant: 'success' })
        })
        .catch((error) => {
          enqueueSnackbar(error.message, { variant: 'error' })
        })
    },
    [enqueueSnackbar, loginEmail]
  )

  const logoutCallback = useCallback<React.FormEventHandler<HTMLFormElement>>(
    (e) => {
      e.preventDefault()

      logout()
        .then(() => {
          window.location.reload()
        })
        .catch((error) => {
          enqueueSnackbar(error.message, { variant: 'error' })
        })
    },
    [enqueueSnackbar]
  )

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography component="h1" variant="h6">
            Web Authentication Demo
          </Typography>
        </Toolbar>
      </AppBar>

      <div className={css.layout}>
        {userEmail && (
          <Paper className={css.form}>
            <form onSubmit={logoutCallback}>
              <Box mb={2}>
                <Typography>Logged in as {userEmail}</Typography>
              </Box>
              <Button type="submit" variant="contained">
                Logout
              </Button>
            </form>
          </Paper>
        )}

        {!userEmail && (
          <>
            <Paper component="section" className={css.form}>
              <form onSubmit={loginCallback}>
                <Typography component="h2" variant="h6">
                  Login
                </Typography>
                <TextField
                  required
                  fullWidth
                  className={css.input}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={handleLoginEmailChange}
                />
                <Button type="submit" variant="contained">
                  Login
                </Button>
              </form>
            </Paper>

            <Paper component="section" className={css.form}>
              <form onSubmit={registerCallback}>
                <Typography component="h2" variant="h6">
                  Register
                </Typography>
                <TextField
                  required
                  fullWidth
                  className={css.input}
                  label="Email"
                  type="email"
                  autoComplete="email"
                  value={registerEmail}
                  onChange={handleRegisterEmailChange}
                />
                <Button type="submit" variant="contained">
                  Register
                </Button>
              </form>
            </Paper>
          </>
        )}
      </div>
    </>
  )
}

Home.getInitialProps = async (ctx) => {
  let cookieHeader: string | undefined
  if (ctx.req) {
    cookieHeader = ctx.req.headers.cookie
  }

  // Check if the user is logged in and get the user's details.
  // Forward the cookie header during server-side rendering
  const session = await getSession(cookieHeader)

  if (session.user) {
    return { userEmail: session.user.email }
  }

  return {}
}

export default Home
