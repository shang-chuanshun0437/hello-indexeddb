# indexdb.js

A class packaging indexedDB by javascript, use for webapp localstorage.

## Usage

```
let db = new IndexDB({
  name: 'mydb', // required
  version: 1, // optional, the beginning of version, read more from `.use()`
  storeName: 'mystore', // required
  primaryKey: 'id', // required
  indexes: [ // optional
    {
      name: 'id',
      key: 'id', // omissible, if not exists, name will be used as key
      unique: true, // optional
    },
    {
      name: 'std_name',
    },
  ],
})
db.add({
  id: 1001,
  std_name: 'GoFei',
})
db.add({
  id: 1002,
  std_name: 'Yolanda',
})

db.get(1002).then(std => alert(`Name of this student is ${std.std_name}`))
```

## options

When you new the class, you should pass options:

### name

The name of a new indexedDB database instance. You can see it in your browser develop dashboard.

### version

The version of this instance. If you do not pass one, 1 will be used. Read more from `.use` method.

### storeName

Like tables in SQL database, a objectStore in an indexedDB should have a name.

### primaryKey

The primaryKey of every object you put into objectStore.

### indexes

array, contains:

  - name: the name of this index
  - key: the keyPath to use, choose a property of objects those you want to put into
  - unique: whether make the index unique

## methods

All methods return a Promise instance.

### get(key)

Get a object from indexedDB by its primaryKey.

### query(indexName, value)

Get a object by one name of its indexes and certain value. i.e.

```
db.query('std_name', 'GoFei').then(item => console.log(item))
```

Only the first item will be returned even there are several std_name=GoFei in your database.

### all()

Get all records from your objectStore.

### add(item)

Append a object into your database. Notice, your item's properties should contain primaryKey.

### put(item)

Update a object in your database. Notice, your item's properties should contain primaryKey. Or inserts a new record if the given item does not already exist.

### del(key)

Delete a object by its primaryKey.

### close()

Close current connect.

### use({storeName, primaryKey, indexes})

Change objectStore.

1> switch to a exists objectStore, only pass `storeName`.

2> modify current objectStore indexes, use it, pass `storeName` and `indexes`. Notice: primaryKey can NOT be modified. And db.version will be increased 1.

2> add a new objectStore, use it, pass `storeName` and `primaryKey` and `indexes(optional)`. After created, objectStore will be switched to be new objectStore, and db.version will be increased 1.

### $store()

Get current objectStore, you should know the original [indexedDB operation](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore).

```
db.$store().then(objectStore => {
  let request = objectStore.get(1001)
  request.onsuccess = e => {
    ...
  }
})
```

## Extends

Because this library is written to be a ES6 class, so you can easliy extend it:

```
class YourDB extends IndexDB {
  clear() {
    this.$store().then(objectStore => objectStore.clear())
  }
}
```
