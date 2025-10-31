import NpmApiClient from '@client-zone/npm/registry'

const api = new NpmApiClient()

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...(args.map(a => JSON.parse(a))))
console.log(JSON.stringify(result, null, '  '))

/* Example commands
node examples/registry.js getPackage '"work"'
node examples/registry.js search '{ "text": "maintainer:75lb" }'
*/
