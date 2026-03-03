[![view on npm](https://badgen.net/npm/v/@client-zone/npm)](https://www.npmjs.org/package/@client-zone/npm)
[![npm module downloads](https://badgen.net/npm/dt/@client-zone/npm)](https://www.npmjs.org/package/@client-zone/npm)
[![Gihub repo dependents](https://badgen.net/github/dependents-repo/client-zone/npm)](https://github.com/client-zone/npm/network/dependents?dependent_type=REPOSITORY)
[![Gihub package dependents](https://badgen.net/github/dependents-pkg/client-zone/npm)](https://github.com/client-zone/npm/network/dependents?dependent_type=PACKAGE)
[![Node.js CI](https://github.com/client-zone/npm/actions/workflows/node.js.yml/badge.svg)](https://github.com/client-zone/npm/actions/workflows/node.js.yml)

# @client-zone/npm

An isomorphic API client to access npm download and registry data. Full API Reference docs [here](https://github.com/client-zone/npm/blob/main/docs/api.md).

## Examples

First, load and instantiate the client.

```js
import NpmApi from '@client-zone/npm'
const npm = new NpmApi()
```

### Total package downloads over a given time period

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

### Daily package downloads over a given time period

```js
await api.getPackageDownloadHistory('command-line-args', { from: '2019-10-25', to: '2019-10-30' })
```

returns..

```js
[
  { date: '2019-10-25', total: 65433 },
  { date: '2019-10-26', total: 17572 },
  { date: '2019-10-27', total: 13221 },
  { date: '2019-10-28', total: 61587 },
  { date: '2019-10-29', total: 68324 },
  { date: '2019-10-30', total: 67366 }
]
```

### Fetch package manifest data

```js
await api.getPackage('work', { latest: true })
```

Returns..

```
{
  "name": "work",
  "author": {
    "name": "Lloyd Brookes",
    "email": "opensource@75lb.com",
    "url": "http://75lb.com"
  },
  "version": "0.11.1",
  "description": "Isomorphic, async iterable command queue",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/75lb/work.git"
  },
  "type": "module",
  "exports": {
    "import": "./index.js",
    "require": "./dist/index.cjs"
  },
  "keywords": [],
  "license": "MIT",
  "engines": {
    "node": ">=12.20"
  },
  "scripts": {
    "test": "npm run dist && npm run test:ci",
    "test:ci": "75lb-nature test-runner test/*.js",
    "dist": "75lb-nature cjs-build index.js"
  },
  "peerDependencies": {
    "@75lb/nature": "latest"
  },
  "peerDependenciesMeta": {
    "@75lb/nature": {
      "optional": true
    }
  },
  "standard": {
    "ignore": [
      "tmp",
      "dist"
    ],
    "envs": []
  },
  "devDependencies": {
    "sleep-anywhere": "^2.1.2"
  },
  "gitHead": "a71b21fb24e2d6cfd07ccc23eeb8ff416d0b702d",
  "_id": "work@0.11.1",
  "bugs": {
    "url": "https://github.com/75lb/work/issues"
  },
  "homepage": "https://github.com/75lb/work#readme",
  "_nodeVersion": "25.0.0",
  "_npmVersion": "11.6.2",
  "dist": {
    "integrity": "sha512-MD0EyQErNOvo2hEnEVrRv85ffDNe2ZXV7dJpFVO3+W+j4J9BPIXMRrqEBNUuir5wloi86gyD+h1UD2vJtw3v2g==",
    "shasum": "4ac21bc541259780643eece394ee839e9cef581a",
    "tarball": "https://registry.npmjs.org/work/-/work-0.11.1.tgz",
    "fileCount": 7,
    "unpackedSize": 7894,
    "signatures": [
      {
        "keyid": "SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U",
        "sig": "MEUCIQCqOAFJWQfrKqbvDDkoWSuimE+OTQ48j0OjS4a/S7I5sgIgYnUk7/kAu8e15DfxUK4n77T59UpLbzgcnyFjrGFL3Dw="
      }
    ]
  },
  "directories": {},
  "_npmOperationalInternal": {
    "host": "s3://npm-registry-packages-npm-production",
    "tmp": "tmp/work_0.11.1_1761940578799_0.1455090820753635"
  },
  "_hasShrinkwrap": false
}

```

### Search the npm registry

```js
await api.search({ text: 'maintainer:75lb' })
```

Returns

```
[
  {
    "name": "command-line-args",
    "keywords": [
      "argv",
      "parse",
      "argument",
      "args",
      "option",
      "options",
      "parser",
      "parsing",
      "cli",
      "command",
      "line"
    ],
    "version": "6.0.1",
    "description": "A mature, feature-complete library to parse command-line options.",
    "sanitized_name": "command-line-args",
    "publisher": {
      "email": "75pound@gmail.com",
      "username": "75lb"
    },
    "maintainers": [
      {
        "email": "75pound@gmail.com",
        "username": "75lb"
      }
    ],
    "license": "MIT",
    "date": "2024-10-28T12:50:34.575Z",
    "links": {
      "homepage": "https://github.com/75lb/command-line-args#readme",
      "repository": "git+https://github.com/75lb/command-line-args.git",
      "bugs": "https://github.com/75lb/command-line-args/issues",
      "npm": "https://www.npmjs.com/package/command-line-args"
    }
  },
  ...,
  ...,
  ...
]
```
* * *

&copy; 2021-2025 [Lloyd Brookes](https://github.com/75lb) \<opensource@75lb.com\>.

Documented by [jsdoc-to-markdown](https://github.com/jsdoc2md/jsdoc-to-markdown).
