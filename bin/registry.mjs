import NpmApiClient from '@75lb/npm-api/registry'
import fetch from 'node-fetch'

const api = new NpmApiClient({ fetch })

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...args)
console.log(JSON.stringify(result, null, '  '))
