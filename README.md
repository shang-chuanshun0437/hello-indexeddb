# HelloIndexedDB

A library to operate IndexedDB easily.

## Install

```
npm install --save hello-indexeddb
```

## Usage

ES6: 

```
import HelloIndexedDB from 'hello-indexeddb/src/hello-indexeddb'
```

With pack tools like webpack:

```
import HelloIndexedDB from 'hello-indexeddb'
```

CommonJS:

```
const HelloIndexedDB = require('hello-indexeddb')
```

AMD & CMD:

```
define(function(require, exports, module) {
  const HelloIndexedDB = require('hello-indexeddb')
})
```

Normal Browsers:

```
<script src="dist/hello-indexeddb.js"></script>
<script>
let idb = new HelloIndexedDB(...)
</scirpt>
```

To use:

```
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

(async function() {
  await idb.put('key1', 'value2')
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

```
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

```
let obj = await idb.get('key1')
```

### query(key, value)

Get objects by one name of its indexes key and certain value. i.e.

```
let objs = await idb.query('name', 'GoFei')
```

In which, `name` is a index name in your `options.indexes`, not the key, remember this. 
So you'd better to pass the name and the key same value when you creat database.

Return an array, which contains objects with key equals value.

### all()

Get all records from your objectStore.

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
So it is better to use `put` then `add`.

### delete(key)

Delete a object by its primaryKey.

```
await idb.delete('1000')
```

### use(objectStoreName)

Switch to another store, return a new instance of HelloIndexedDB.

```
let idb2 = idb.use('store2')
```

The methods of idb2 is the same as idb, but use 'store2' as its current objectStore.

### connect()

Connect to the database and get a indexeddb database instance.

```
let db = idb.connect()
```

`db` is a instance of IDBDatabase, so you can use it for many use.
Read offical document [here](https://developer.mozilla.org/en-US/docs/Web/API/IDBDatabase).

```
let db = idb.connect()
let objectStoreNames = db.objectStoreNames
```

### close()

Close current connect.

```
await idb.close()
```

Remember to close database connect if you do not use it any more.
