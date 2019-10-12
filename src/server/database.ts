import { createPool } from 'slonik'
import { DATABASE_URL } from '../config'

export default createPool(DATABASE_URL)
