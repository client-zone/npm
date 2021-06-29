import NpmApiClient from '../npm-downloads.mjs'
import fetch from 'node-fetch'
import util from 'util'
util.inspect.defaultOptions.depth = 6
util.inspect.defaultOptions.breakLength = process.stdout.columns
util.inspect.defaultOptions.maxArrayLength = Infinity

const api = new NpmApiClient({ fetch })

const queue = await api.getTotalDownloadsQueue(process.argv[2] || ['renamer', 'byte-size'], 'last-week')
const result = await queue.process()
console.log(result)
