import ApiClient from '@client-zone/npm'

const api = new ApiClient()

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...(args.map(a => JSON.parse(a))))
console.log(JSON.stringify(result, null, '  '))

/* Example commands
node examples/cli.js getTotalPackageDownloads '"renamer"' '"last-year"'
node examples/cli.js getPackageDownloadHistory '"renamer"'
node examples/cli.js getPackage '"work"'
node examples/cli.js search '{ "text": "maintainer:75lb" }'
*/
