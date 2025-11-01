<a name="module_@client-zone/npm"></a>

## @client-zone/npm

* [@client-zone/npm](#module_@client-zone/npm)
    * [NpmApi](#exp_module_@client-zone/npm--NpmApi) ⏏
        * [.getTotalPackageDownloads(packageNames, [point])](#module_@client-zone/npm--NpmApi+getTotalPackageDownloads)
        * [.getPackageDownloadHistory(packageName)](#module_@client-zone/npm--NpmApi+getPackageDownloadHistory)
        * [.getPackage(packageName)](#module_@client-zone/npm--NpmApi+getPackage)
        * [.search()](#module_@client-zone/npm--NpmApi+search)

<a name="exp_module_@client-zone/npm--NpmApi"></a>

### NpmApi ⏏
An isomorphic API client to access npm download and registry data.

**Kind**: Exported class  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  
<a name="module_@client-zone/npm--NpmApi+getTotalPackageDownloads"></a>

#### npm.getTotalPackageDownloads(packageNames, [point])
**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  
**See**: https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| packageNames | <code>Array.&lt;string&gt;</code> |  | One or more package names |
| [point] | <code>string</code> | <code>&quot;last-month&quot;</code> | One of the point values described in the [docs](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values). |

<a name="module_@client-zone/npm--NpmApi+getPackageDownloadHistory"></a>

#### npm.getPackageDownloadHistory(packageName)
Returns daily download totals for a package over a given time period.

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>string</code> | npm package name |
| [options.period] | <code>string</code> | One of the point values specified [here](https://github.com/npm/registry/blob/main/docs/download-counts.md#parameters) (e.g. `last-day`, `last-week` etc). Either specify `options.period` or `options.from` (and optionally `options.to`) but not both. |
| [options.from] | <code>string</code> \| <code>Date</code> | Time period start date. |
| [options.to] | <code>string</code> \| <code>Date</code> | Time period end date. If `from` is specified but `to` is not, `to` defaults to today's date. |

<a name="module_@client-zone/npm--NpmApi+getPackage"></a>

#### npm.getPackage(packageName)
Not CORS-friendly. [Docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage). [Response data](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md).

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>string</code> | package name |
| [options.latest] | <code>boolean</code> | Include only the latest version, not all versions |
| [options.abbreviated] | <code>boolean</code> | Include only the install data. Doesn't appear to work with `latest`. |

<a name="module_@client-zone/npm--NpmApi+search"></a>

#### npm.search()
See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  

| Param | Type | Description |
| --- | --- | --- |
| [options.size] | <code>number</code> | Max 250 |
| [options.text] | <code>string</code> | Full-text search string |

**Example**  
```js
registryApi.search({ text: `maintainer:75lb` })
registryApi.search({ text: `author:75lb`, size: 10 })
```
