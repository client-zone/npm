import ApiClient from '@client-zone/npm/downloads'

const api = new ApiClient()

const [method, ...args] = process.argv.slice(2)
const result = await api[method](...(args.map(a => JSON.parse(a))))
console.log(JSON.stringify(result, null, '  '))

/* Example commands
node bin/downloads.js getTotalPackageDownloads '"renamer"' '"last-year"'
node bin/downloads.js getPackageDownloadHistory '"renamer"'
*/
