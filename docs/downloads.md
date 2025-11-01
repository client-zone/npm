<a name="NpmDownloads"></a>

## NpmDownloads
API Client for the npm download-counts API.

**Kind**: global class  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

* [NpmDownloads](#NpmDownloads)
    * [.getTotalPackageDownloads(packageNames, point)](#NpmDownloads+getTotalPackageDownloads)
    * [.getPackageDownloadHistory()](#NpmDownloads+getPackageDownloadHistory)

<a name="NpmDownloads+getTotalPackageDownloads"></a>

### npm.getTotalPackageDownloads(packageNames, point)
**Kind**: instance method of [<code>NpmDownloads</code>](#NpmDownloads)  
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
<a name="NpmDownloads+getPackageDownloadHistory"></a>

### npm.getPackageDownloadHistory()
Returns all downloads per day for a package.

**Kind**: instance method of [<code>NpmDownloads</code>](#NpmDownloads)  
**See**: https://github.com/npm/registry/blob/main/docs/download-counts.md  

| Param | Type |
| --- | --- |
| options.from | <code>string</code> \| <code>Date</code> | 
| options.to | <code>string</code> | 
| options.period | <code>string</code> | 

