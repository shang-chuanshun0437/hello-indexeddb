# HelloIndexedDB

A library to operate IndexedDB easily.

## Install

```
npm install --save hello-indexeddb
```

## Usage

ES6: 

```js
import HelloIndexedDB from 'hello-indexeddb/src/hello-indexeddb'
```

With pack tools like webpack:

```js
import HelloIndexedDB from 'hello-indexeddb'
```

CommonJS:

```js
const HelloIndexedDB = require('hello-indexeddb')
```

AMD & CMD:

```html
<script src="dist/hello-indexeddb.js"></script>
<script>
define(['hello-indexeddb'], function(HelloIndexedDB) {
  // ...
})
</script>
```

Normal Browsers:

```html
<script src="dist/hello-indexeddb.js"></script>
<script>
const HelloIndexedDB = window['hello-indexeddb']
const idb = new HelloIndexedDB(options)
</scirpt>
```

How to use:

```js
let idb = new HelloIndexDB({
  name: 'mydb',
  version: 1,
  stores: [
    {
      name: 'store1',
      keyPath: 'id',
    },
  ],
  use: 'store1',
})

;(async function() {
  await idb.put({ id: 'key1', value: 'value2' })
  let obj = await idb.get('key1')
})()
```

## Methods

Almost methods return a instance of promise.

### constructor(options)

Use `new` to creat or update a database.

**options**

- name: the name of a indexedDB database. You can see it in your browser dev-tools.
- version: the version of this indexedDB instance.
- stores: an array to define objectStores. At least one store config should be passed.
- use: which objectStore to use

Example:

```js
// an example of index config
const index1 = {
  name: 'id', // required
  keyPath: 'id', // optional
  unique: true, // optional
}
// an example of store config
const store1 = {
  name: 'store1', // required, objectStore name
  keyPath: 'id', // required, objectStore keyPath
  indexes: [ // optional
    index1,
    index2,
    index3,
  ],
}
const store2 = {
  name: 'store2',
  isKeyValue: true, // make this store to be key-value store, which can use get(key) to return value directly.
}
// an example of options
const options = {
  name: 'my_indexeddb',
  version: 1,
  stores: [
    store1, 
    store2,
  ],
  use: 'store1',
}
const idb = new HelloIndexedDB(options)
```

### get(key)

Get a object from indexedDB by its keyPath.

```js
let obj = await idb.get('key1')
// { id: 'key1', value: 'value1' }
```

### find(indexName, value)

Get the first object whose index name is `key` and value is `value`.
Notice, `key` is a indexName.

```js
let obj = await idb.find('name', 'tomy')
// { id: '1001', name: 'tomy', age: 10 }
```

If you find a key which is not in indexes, no results will return.

### query(indexName, value, compare)

Get objects by one name of its indexes key and certain value. 
Notice, `key` is a indexName. 
i.e.

```js
let objs = await idb.query('name', 'GoFei')
// [{ id: '1002', name: 'GoFei', age: 10 }]
// if there are some other records with name equals GoFei, they will be put in the array
```

In which, `name` is an index name in your `options.indexes`, not index key, remember this. So you'd better to pass the name and the key same value when you creat database.

Return an array, which contains objects with key equals value.
If you give a index name which is not in indexes options, no results will return.

**compare**

Choose from `>` `>=` `<` `<=` `=` `!=` `%` `in`. 
`%` means 'LIKE', only used for string search.
`in` means 'IN', value should be an array.
Notice `!=` will use `!==`, `=` will use `===`, so you should pass right typeof of value.
`!=` `%` and `in` are not supported by indexedDB default, so you should make indexName and indexKeyPath same when use these.

### select([{ key, value, compare, optional }])

Select objects with multiple conditions. Pass conditions as an array, each condition item contains:

- key: an object property
- value: the value to be found
- compare: `>` `>=` `<` `<=` `!=` `=` `%`
- optional: wether to make this condition to be an optional, default 'false' which means 'AND' in SQL.

Examples:

```js
// to find objects which amount>10 AND color='red'
let objs = await idb.select([
  { key: 'amount', value: 10, compare: '>' },
  { key: 'color', value: 'red' },
])

// to find objects which amount>10 OR amount<6
let objs = await idb.select([
  { key: 'amount', value: 10, compare: '>', optional: true },
  { key: 'amount', value: 6, compare: '<', optional: true },
])

// to find objects which amount>10 AND (color='red' OR color='blue')
let objs = await idb.select([
  { key: 'amount', value: 10, compare: '>' },
  { key: 'color', value: 'red', optional: true },
  { key: 'color', value: 'blue', optional: true },
])
```

NOTICE: the final logic is `A AND B AND C AND (D OR E OR F)`.

`select` is not based on indexes, so it can be used with any property of objects.

NOTICE: select do NOT use index to query data, it face performance problem. Don't use indexName to query. So don't use it as possible.

### all()

Get all records from your objectStore.

### first()

Get the first record from current objectStore.

### last()

Get the last record from current objectStore.

### some(count, offset)

Get some records from your objectStore by count.

- count: the count to be return
- offset: from which index to find, default 0

```js
let objs = await idb.some(3) // get the first 3 records from db
let objs = await idb.some(3, 5) // get 6th-8th records from db
```

### keys()

Get all primary keys from your objectStore.

### count()

Get all records count.

### add(obj)

Append a object into your database. 
Notice, obj's properties should contain keyPath.
If obj's keyPath exists in the objectStore, an error will be thrown.
So use `put` instead as possible.

### put(obj)

Update a object in your database. 
Notice, your item's properties should contain keyPath. 
If the object does not exist, it will be added into the database.
So it is better to use `put` instead of `add` unless you know what you are doing.

### delete(key)

Delete a object by its keyPath.

```js
await idb.delete('1000')
```

### clear() 

Delete all data. Remember to backup your data before you clean.

## Special Methods

### each(fn)

Iterate with cursor:

```js
await idb.each((value, index, cursor, resolve, reject) => {
  if (index >= 10) {
    resolve()
  }
  else {
    cursor.continue()
  }
})
```

- value: the object at the position of cursor
- index
- cursor: the indexedDB cursor in this action, if you pass this prarameter, you should MUST invoke cursor.continue() by yourself
- resolve: a function to stop the iterator with resolved
- reject: a function to stop the iterator with rejected

### reverse(fn)

Very like `each` method, but iterate from end to begin.

### objectStore()

Get current objectStore with 'readonly' mode.

```js
let objectStore = await idb.objectStore()
let name = objectStore.name
```

### keyPath()

Get keyPath.

```js
let keyPath = await idb.keyPath()
```

### db()

Get current database.

```js
let db = await idb.db()
```

### close()

Close current connect.

```js
await idb.close()
```

Remember to close database connect if you do not use it any more.

### use(objectStoreName)

_not async function_

Switch to another store, return a new instance of HelloIndexedDB.

```js
let idb2 = idb.use('store2')
```

`use` method is the only method which is not an async function.

The methods of idb2 is the same as idb, but use 'store2' as its current objectStore.

## Storage

Use like a pure key-value Storage such as localStorage:

```js
let store = new HelloIndexedDB()
await store.setItem('name', 'tomy')
let name = await store.getItem('name')
```

For this feature, you should create a store which has `isKeyValue` property to be `true`:

```js
// a store config
const store1 = {
  name: 'my-key-value-store',
  isKeyValue: true,
}
```

Then you can use this store with `getItem` `setItem` `removeItem`:

```js
let kvdb = idb.use('my-key-value-store')
let value = await kvdb.getItem(key)
```

## test

To test whether it works, after you clone this repo, run:

```
npm install
npm test
```

Then you can see an opened page and find it works.
The test cases are in [examples/index.html](.examples/index.html).
Notice: you should not open the file directly, or the last test case will fail.
