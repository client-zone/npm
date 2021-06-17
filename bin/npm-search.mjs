import NpmApiClient from '../npm-api.mjs'
import fetch from 'node-fetch'
import util from 'util'
util.inspect.defaultOptions.depth = 6
util.inspect.defaultOptions.breakLength = process.stdout.columns
util.inspect.defaultOptions.maxArrayLength = Infinity

const api = new NpmApiClient({ verbosex: true })
api.setFetch(fetch)

async function start () {
  const result = await api.search(process.argv[2] || 'maintainer:75lb')
  console.log(result)
}

start().catch(console.error)
