import ApiClient from '@client-zone/npm/downloads'
import fetch from 'node-fetch'

const api = new ApiClient({ fetch })

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...(args.map(a => JSON.parse(a))))
if (result.process) {
  const output = await result.process()
  console.log(JSON.stringify(output, null, '  '))
} else {
  console.log(JSON.stringify(result, null, '  '))
}
