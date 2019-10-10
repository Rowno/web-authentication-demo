import { FunctionComponent, useCallback } from 'react'
import { Button, AppBar, Typography, Toolbar } from '@material-ui/core'
import { Box } from '@material-ui/core'
import { useSnackbar } from 'notistack'
import register from '../client/register'
import login from '../client/login'

const Home: FunctionComponent = () => {
  const { enqueueSnackbar } = useSnackbar()

  const registerCallback = useCallback(() => {
    register()
      .then(() => {
        enqueueSnackbar('Register success', { variant: 'success' })
      })
      .catch(error => {
        enqueueSnackbar(error.message, { variant: 'error' })
      })
  }, [])

  const loginCallback = useCallback(() => {
    login()
      .then(() => {
        enqueueSnackbar('Login success', { variant: 'success' })
      })
      .catch(error => {
        enqueueSnackbar(error.message, { variant: 'error' })
      })
  }, [])

  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography component="h1" variant="h6">
            Web Authentication Demo
          </Typography>
        </Toolbar>
      </AppBar>

      <Box m="24px">
        <Box clone marginRight="16px">
          <Button variant="contained" onClick={registerCallback}>
            Register
          </Button>
        </Box>
        <Button variant="contained" onClick={loginCallback}>
          Login
        </Button>
      </Box>
    </>
  )
}

export default Home
