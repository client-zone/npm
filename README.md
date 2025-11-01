[![view on npm](https://badgen.net/npm/v/@client-zone/npm)](https://www.npmjs.org/package/@client-zone/npm)
[![npm module downloads](https://badgen.net/npm/dt/@client-zone/npm)](https://www.npmjs.org/package/@client-zone/npm)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/client-zone/npm)](https://github.com/client-zone/npm/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/client-zone/npm)](https://github.com/client-zone/npm/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/client-zone/npm/actions/workflows/node.js.yml/badge.svg)](https://github.com/client-zone/npm/actions/workflows/node.js.yml)

# @client-zone/npm

An isomorphic API client to access npm download and registry data. Full API Reference docs here.

## Examples

First, load and instance the client.

```js
import NpmApi from '@client-zone/npm'
const npm = new NpmApi({ console })
```

### Package downloads over a given time period

This request..

```js
await npm.getTotalPackageDownloads(['renamer', 'handbrake-js'], 'last-year')
```

returns..

```
{
 packages: [
   { name: 'renamer', downloads: 1062040 },
   { name: 'handbrake-js', downloads: 58780 }
 ],
 total: 1120820
}
```



* * *

&copy; 2021-2025 [Lloyd Brookes](https://github.com/75lb) \<opensource@75lb.com\>.

Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
