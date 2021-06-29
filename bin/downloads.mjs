import ApiClient from '../npm-downloads.mjs'
import fetch from 'node-fetch'

const api = new ApiClient({ fetch })

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...(args.map(a => JSON.parse(a))))
console.log(JSON.stringify(result, null, '  '))
