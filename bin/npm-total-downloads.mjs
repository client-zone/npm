import NpmApiClient from '../npm-api.mjs'
import fetch from 'node-fetch'
import util from 'util'

const api = new NpmApiClient()
api.setFetch(fetch)

async function start () {
  const result = await api.getTotalDownloads(process.argv[2] || ['renamer', 'byte-size'], 'last-week')
  console.error(util.inspect(result, { depth: 6, colors: true, maxArrayLength: Infinity, breakLength: process.stdout.columns }))
}

start().catch(console.error)
