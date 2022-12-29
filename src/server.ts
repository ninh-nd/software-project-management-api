import * as dotenv from 'dotenv'
dotenv.config()
import mongoose from 'mongoose'
import app from './app'
import { redisClient } from './redisServer'

const port = process.env.PORT || 3001
if (!process.env.MONGO_URI) {
  throw new Error('MONGO_URI must be defined')
}
mongoose.connect(process.env.MONGO_URI)
redisClient.connect().catch((err: any) => {
  console.error(err)
})

app.listen(port)
