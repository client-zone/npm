import NpmApiClient from '../npm-api.mjs'
import fetch from 'node-fetch'
import util from 'util'

const api = new NpmApiClient()
api.setFetch(fetch)

async function start () {
  const user = process.argv[2] || 'hakanols'
  const queue = await api.getUserTotalDownloadsQueue(user)
  console.error(util.inspect(queue, { depth: 1, colors: true, maxArrayLength: Infinity, breakLength: process.stdout.columns }))
  for await (const result of queue) {
    console.log(result)
    console.error(util.inspect(queue, { depth: 1, colors: true, maxArrayLength: Infinity, breakLength: process.stdout.columns }))
  }
}

start().catch(console.error)
