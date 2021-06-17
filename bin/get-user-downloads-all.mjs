import { NpmDownloadsClient } from '../index-node.mjs'
import fetch from 'node-fetch'
import util from 'util'

const api = new NpmDownloadsClient()
api.setFetch(fetch)

async function start () {
  const user = process.argv[2] || 'hakanols'
  const queue = await api.getUserTotalDownloadsQueue(user)
  const result = await queue.process()
  console.error(util.inspect(result, { depth: 6, colors: true, maxArrayLength: Infinity, breakLength: process.stdout.columns }))
}

start().catch(console.error)
