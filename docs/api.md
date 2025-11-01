<a name="NpmApi"></a>

## NpmApi
API Client for the npm download-counts API.

**Kind**: global class  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

* [NpmApi](#NpmApi)
    * [.getTotalPackageDownloads(packageNames, point)](#NpmApi+getTotalPackageDownloads)
    * [.getPackageDownloadHistory()](#NpmApi+getPackageDownloadHistory)
    * [.getPackage()](#NpmApi+getPackage)
    * [.search()](#NpmApi+search)

<a name="NpmApi+getTotalPackageDownloads"></a>

### npm.getTotalPackageDownloads(packageNames, point)
**Kind**: instance method of [<code>NpmApi</code>](#NpmApi)  
**See**: https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| packageNames | <code>Array.&lt;string&gt;</code> |  | One or more package names |
| point | <code>string</code> | <code>&quot;last-month&quot;</code> | One of the point values described in the [docs](https://github.com/npm/registry/blob/master/docs/download-counts.md#point-values). |

**Example**  
This request..
```js
const result = await npm.getTotalPackageDownloads(['renamer', 'handbrake-js'], 'last-year')
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
<a name="NpmApi+getPackageDownloadHistory"></a>

### npm.getPackageDownloadHistory()
Returns daily download totals for a package over a given time period.

**Kind**: instance method of [<code>NpmApi</code>](#NpmApi)  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

| Param | Type |
| --- | --- |
| [options.from] | <code>string</code> \| <code>Date</code> | 
| [options.to] | <code>string</code> \| <code>Date</code> | 
| [options.period] | <code>string</code> | 

<a name="NpmApi+getPackage"></a>

### npm.getPackage()
Not CORS-friendly.
Docs: https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#getpackage
Response data: https://github.com/npm/registry/blob/main/docs/responses/package-metadata.md

[options.latest]{boolean} - Include only the latest version, not all versions
[options.abbreviated]{boolean} - Include only the install data. Doesn't appear to work with `latest`.

**Kind**: instance method of [<code>NpmApi</code>](#NpmApi)  
<a name="NpmApi+search"></a>

### npm.search()
See [docs](https://github.com/npm/registry/blob/master/docs/REGISTRY-API.md#get-v1search).
[options.size]{number} - Max 250
[options.text]{string} - Full-text search string

**Kind**: instance method of [<code>NpmApi</code>](#NpmApi)  
**Example**  
```js
registryApi.search({ text: `maintainer:75lb` })
registryApi.search({ text: `author:75lb`, size: 10 })
```
