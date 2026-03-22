<a name="module_@client-zone/npm"></a>

## @client-zone/npm

* [@client-zone/npm](#module_@client-zone/npm)
    * [NpmApi](#exp_module_@client-zone/npm--NpmApi) ⏏
        * [.getTotalPackageDownloads(packageNames, [point])](#module_@client-zone/npm--NpmApi+getTotalPackageDownloads)
        * [.getPackageDownloadHistory(packageName, [options])](#module_@client-zone/npm--NpmApi+getPackageDownloadHistory)
        * [.getPackage(packageName, [options])](#module_@client-zone/npm--NpmApi+getPackage)
        * [.search([options])](#module_@client-zone/npm--NpmApi+search)

<a name="exp_module_@client-zone/npm--NpmApi"></a>

### NpmApi ⏏
An isomorphic API client to access npm download and registry data.

**Kind**: Exported class  
<a name="module_@client-zone/npm--NpmApi+getTotalPackageDownloads"></a>

#### npm.getTotalPackageDownloads(packageNames, [point])
**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  
**See**: https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| packageNames | <code>Array.&lt;string&gt;</code> |  | One or more package names |
| [point] | <code>string</code> | <code>&quot;last-month&quot;</code> | One of the point values described in the [docs](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values). |

<a name="module_@client-zone/npm--NpmApi+getPackageDownloadHistory"></a>

#### npm.getPackageDownloadHistory(packageName, [options])
Returns daily download totals for a package over a given time period.

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>string</code> | npm package name |
| [options] | <code>object</code> |  |
| [options.period] | <code>string</code> | One of the point values specified [here](https://github.com/npm/registry/blob/main/docs/download-counts.md#parameters) (e.g. `last-day`, `last-week` etc). Either specify `options.period` or `options.from` (and optionally `options.to`) but not both. |
| [options.from] | <code>string</code> \| <code>Date</code> | Time period start date. Either a Date object or string in the format YYYY-MM-DD. |
| [options.to] | <code>string</code> \| <code>Date</code> | Time period end date. Either a Date object or string in the format YYYY-MM-DD. If `from` is specified but `to` is not, `to` defaults to today's date. |
| [options.groupBy] | <code>string</code> | Currently only accepts `month`. |

<a name="module_@client-zone/npm--NpmApi+getPackage"></a>

#### npm.getPackage(packageName, [options])
[Docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage). [Response data](https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md).

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  

| Param | Type | Description |
| --- | --- | --- |
| packageName | <code>string</code> | package name |
| [options] | <code>object</code> |  |
| [options.latest] | <code>boolean</code> | Include only the latest version, not all versions |
| [options.abbreviated] | <code>boolean</code> | Include only the install data. Doesn't appear to work with `latest`. |

<a name="module_@client-zone/npm--NpmApi+search"></a>

#### npm.search([options])
Maintainer searches now appear to exclude deprecated packages by default. There is no way to actively search for deprecated packages.

Special search qualifiers can be provided in the full-text query:

    author:bcoe: Show/filter results in which bcoe is the author
    maintainer:bcoe: Show/filter results in which bcoe is qualifier as a maintainer
    scope:foo: Show/filter results published under the @foo scope
    keywords:batman: Show/filter results that have batman in the keywords
        separating multiple keywords with
            , acts like a logical OR
            + acts like a logical AND
            ,- can be used to exclude keywords
    not:unstable: Exclude packages whose version is < 1.0.0
    not:insecure: Exclude packages that are insecure or have vulnerable dependencies (based on the nsp registry)
    is:unstable: Show/filter packages whose version is < 1.0.0
    is:insecure: Show/filter packages that are insecure or have vulnerable dependencies (based on the nsp registry)
    boost-exact:false: Do not boost exact matches, defaults to true

**Kind**: instance method of [<code>NpmApi</code>](#exp_module_@client-zone/npm--NpmApi)  
**See**: [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).  

| Param | Type | Description |
| --- | --- | --- |
| [options] | <code>object</code> |  |
| [options.size] | <code>number</code> | Max 250 |
| [options.text] | <code>string</code> | Full-text search string |

**Example**  
```js
npm.search({ text: `maintainer:75lb` })
npm.search({ text: `author:75lb`, size: 10 })
```
