import { FunctionComponent } from 'react'
import { Box, Button, AppBar, Typography, Toolbar } from '@material-ui/core'
import register from '../src/register'
import login from '../src/login'

const Home: FunctionComponent = () => {
  return (
    <>
      <AppBar position="static">
        <Toolbar variant="dense">
          <Typography component="h1" variant="h6">
            Web Authentication
          </Typography>
        </Toolbar>
      </AppBar>

      <Box m="24px">
        <Box clone marginRight="16px">
          <Button variant="contained" onClick={register}>
            Register
          </Button>
        </Box>
        <Button variant="contained" onClick={login}>
          Login
        </Button>
      </Box>
    </>
  )
}

export default Home
