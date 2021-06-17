import NpmApiClient from '../npm-api.mjs'
import fetch from 'node-fetch'
import util from 'util'

const api = new NpmApiClient()
api.setFetch(fetch)

async function start () {
  const result = await api.getPackagesByMaintainer(process.argv[2] || '75lb')
  console.error(util.inspect(result, { depth: 6, colors: true, maxArrayLength: Infinity, breakLength: process.stdout.columns }))
}

start().catch(console.error)
