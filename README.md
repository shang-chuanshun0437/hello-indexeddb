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

```js
define(['hello-indexeddb'], function(HelloIndexedDB) {
  // ...
})
```

Normal Browsers:

```html
<script src="dist/hello-indexeddb.js"></script>
<script>
let idb = new HelloIndexedDB(options)
</scirpt>
```

To use:

```js
let idb = new HelloIndexDB({
  name: 'mydb',
  version: 1,
  stores: [
    {
      name: 'store1',
      primaryKey: 'id',
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

When you new the class, you should pass options:

- name: required, the name of a indexedDB database. You can see it in your browser dev-tools.
- version: required, the version of this indexedDB instance.
- stores: optional, an array to define objectStores. At least one store config should be passed.
- use: required, which store to use

A store config:

```js
{
  name: 'store1', // required, objectStore name
  primaryKey: 'id', // required, objectStore keyPath
  indexes: [ // optional
    {
      name: 'id', // required
      key: 'id', // optional
      unique: true, // optional
    },
    {
      ...
    },
  ],
},
```

### get(key)

Get a object from indexedDB by its primaryKey.

```js
let obj = await idb.get('key1')
```

### find(key, value)

Get the first object whose index name is `key` and value is `value`.
Notice, `key` is a index name.

```js
let obj = await idb.find('name', 'tomy')
```

If you find a key which is not in indexes, no results will return.

### query(key, value, compare)

Get objects by one name of its indexes key and certain value. i.e.

```js
let objs = await idb.query('name', 'GoFei')
```

In which, `name` is an index name in your `options.indexes`, not the key, remember this. 
So you'd better to pass the name and the key same value when you creat database.

Return an array, which contains objects with key equals value.
If you find a key which is not in indexes, no results will return.

**compare**

Choose from `>` `>=` `<` `<=` `!=` `=` `%`. 
`%` means 'LIKE', only used for string search.
Notice `!=` will use `!==`, `=` will use `===`, so you should pass right typeof of value.

### select([{ key, value, compare, optional }])

Select objects with multiple conditions. Pass conditions as an array, each condition item contains:

- key: an index name
- value: the value of index
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

### all()

Get all records from your objectStore.

### keys()

Get all primary keys from your objectStore.

### count()

Get all records count.

### add(item)

Append a object into your database. 
Notice, your item's properties should contain primaryKey.
The item whose primaryKey exists in the objectStore, an error will be thrown.

### put(item)

Update a object in your database. 
Notice, your item's properties should contain primaryKey. 
If the object does not exist, it will be added into the database.
So it is better to use `put` instead of `add` unless you know what you are doing.

### delete(key)

Delete a object by its primaryKey.

```js
await idb.delete('1000')
```

### clear() 

Delete all data. Remember to backup your data before you clean.

### each(fn)

Iterate with cursor:

```js
await idb.each((value, index, next, stop) => {
  if (index >= 10) {
    stop()
  }
  else {
    next()
  }
})
```

- value: the object at the position of cursor
- index
- next: a function which should be call to jump to next position
- stop: a function which is used to stop iterating

You can dispass `next` and `stop`:

```js
await idb.each((value, index) => {
  // ...
})
```

It will iterate all objects in your current store.
And `fn` should NOT be an async function.

### request(prepare, success, error)

Make a request to current objectStore:

```js
idb.request(
  objectStore => objectStore.get('myKey'),
  value => console.log(value),
  error => console.error(error),
)
```

It is useful when you can't get results by previous given methods.

### connect()

Connect to the database and get a indexeddb database instance.

```js
let db = idb.connect()
```

`db` is a instance of IDBDatabase, so you can use it for many use.
Read offical document [here](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase).

```js
let db = idb.connect()
let objectStoreNames = db.objectStoreNames
```

### close()

Close current connect.

```js
await idb.close()
```

Remember to close database connect if you do not use it any more.

### use(objectStoreName)

Switch to another store, return a new instance of HelloIndexedDB.

```js
let idb2 = idb.use('store2')
```

The methods of idb2 is the same as idb, but use 'store2' as its current objectStore.
