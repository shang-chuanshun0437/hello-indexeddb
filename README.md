idb# indexdb.js

A class packaging indexedDB by javascript, use for webapp localstorage.

## Usage

```
// created a new database:
let idb = new IndexDB({
  name: 'mydb', // required
  version: 1, // required
  stores: [ // optional, when you create database, it is required, but when you open an exists database it is not needed
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
    ...
  ],
  defaultStoreName: 'store1', // required, which objectStore to use as defaultStore, you can use `.use` method to change objectStore
})

// add some data, but if you run the script again, error will be threw out, because add method should not add item whose id is exists in this objectStore. It's recommended to use `put` method.
idb.add({
  id: 1001,
  std_name: 'GoFei',
})
idb.add({
  id: 1002,
  std_name: 'Yolanda',
})

idb.get(1002).then(std => alert(`Name of this student is ${std.std_name}`))

// update database
idb = new IndexDB({
    name: 'mydb',
    version: 2, // notice this, version is updated
    stores: [
        {
            name: 'store1',
            primaryKey: 'id',
            // indexes of store1 are deleted
        },
        {
            name: 'store2',
            primaryKey: 'id',
            // a new objectStore named store2 is added
        }
    ],
    defaultStoreName: 'store1',
})

// change to another objectStore
idb.use('store2')
// add object into store2
idb.add({
    id: '1001',
    name: 'Li Hua',
})
```

## constructor

Use `new` to creat or update a database, and after you initialize, the database is open.

## options

When you new the class, you should pass options:

### name

The name of a new indexedDB database instance. You can see it in your browser develop dashboard.

### version

The version of this instance. If you do not pass one, 1 will be used. Read more from `.use` method.

When to change the version? When you update your js code and want to update the database structure.

### stores

An array to define objectStores.

#### name

Like tables in SQL database, a objectStore in an indexedDB should have a name.

#### primaryKey

The primaryKey of every object you put into objectStore.

#### indexes

array, contains:

  - name: the name of this index
  - key: the keyPath to use, choose a property of objects those you want to put into
  - unique: whether make the index unique

### defaultStoreName

When a new database is created, which objectStore to use as default.

## methods

All methods return a Promise instance.

### get(key)

Get a object from indexedDB by its primaryKey.

### query(key, value)

Get a object by one name of its indexes key and certain value. i.e.

```
idb.query('name', 'GoFei').then(item => console.log(item))
```

in which, `name` is a index name in your `options.indexes`, not the key, remember this. So you'd better to pass the name and the key same value when you creat database.

Only the first item will be returned even there are several std_name=GoFei in your database.

Return an array, which contains objects with key equals value.

### all()

Get all records from your objectStore.

### count()

Get all records count.

### add(item)

Append a object into your database. Notice, your item's properties should contain primaryKey.

### put(item)

Update a object in your database. Notice, your item's properties should contain primaryKey. Or inserts a new record if the given item does not already exist.

### del(key)

Delete a object by its primaryKey.

### close()

Close current connect.

### $use(storeName)

Change to use another objectStore as current objectStore. Return instance:

```
idb.$use('mystore2').add({
  id: 23,
  name: 'Go Six',
})
```

### $store(method = 'readonly')

Get current objectStore, you should know the original [indexedDB operation](https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore).

```
idb.$store().then(objectStore => {
  let request = objectStore.get(1001)
  request.onsuccess = e => {
    ...
  }
})
```

### $connect()

Get db instance.

```
idb.$connect().then(db => {
    console.log(db.objectStoreNames) // you can know all objectStores in your database
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
