import NpmApiClient from '../npm-registry.mjs'
import fetch from 'node-fetch'
import util from 'util'
util.inspect.defaultOptions.depth = 6
util.inspect.defaultOptions.breakLength = process.stdout.columns
util.inspect.defaultOptions.maxArrayLength = Infinity

const api = new NpmApiClient({ fetch })

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...args)
console.log(JSON.stringify(result, null, '  '))
