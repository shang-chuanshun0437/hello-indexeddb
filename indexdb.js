class IndexDB {
	constructor(options) {
		this.options = options
		this.name = options.name
		this.version = options.version || 1
		this.storeName = ''
		this.stores = {}

		this.use(options)
		this.connect()
	}
	connect() {
		return new Promise((resolve, reject) => {
			let {name, version, storeName} = this
			let storage = this.stores[storeName]
			let {primaryKey, indexes} = storage
			let request = window.indexedDB.open(name, version)
			request.onupgradeneeded = e => {
				let db = e.target.result

				// get objectStore
				let objectStore = null
				if (db.objectStoreNames.contains(storeName)) {
					objectStore = e.target.transaction.objectStore(storeName)
				}
				else {
					objectStore = db.createObjectStore(storeName, {keyPath: primaryKey})
				}

				// it's not able to modify primaryKey

				// modify indexes
				if (indexes) {
					let indexNames = objectStore.indexNames
					indexes.forEach(index => {
						if (indexNames.contains(index.name)) {
							objectStore.deleteIndex(index.name)
						}
						objectStore.createIndex(index.name, index.key || index.name, {unique: index.unique})
					})
				}
			}
			request.onerror = e => {
				reject(e)
			}
			request.onsuccess = e => {
				resolve(e.target.result)
			}
		})
	}
	use({storeName, primaryKey, indexes}) {
		let stores = this.stores
		let objectStore = stores[storeName]

		// when create a new objectStore and primaryKey not given
		if (!objectStore && !primaryKey) {
			throw new Error('primaryKey required!')
			return
		}
		// when only switch to a exists objectStore
		if (objectStore && !primaryKey && !indexes) {
			this.storeName = storeName
			return
		}
		// when modify a exists objectStore and want to modify primaryKey
		if (objectStore && primaryKey) {
			throw new Error('primaryKey can not be modified!')
			return
		}

		this.storeName = storeName
		this.version ++

		objectStore = stores[storeName] = stores[storeName] || {}
		objectStore.name = storeName
		objectStore.version = this.version
		if (primaryKey) {
			objectStore.primaryKey = primaryKey
		}
		if (indexes) {
			objectStore.indexes = indexes
		}
	}
	$store() {
		return new Promise((resolve, reject) => {
			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readonly').objectStore(storeName)
				resolve(objectStore)
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	get(key) {
		return new Promise((resolve, reject) => {
			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readonly').objectStore(storeName)
				let request = objectStore.get(key)
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	query(indexName, value) {
		return Promise((resolve, reject) => {
			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readonly').objectStore(storeName)
				let objectIndex = objectStore.index(indexName)
				let request = objectIndex.get(value)
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	add(item) {
		return new Promise((resolve, reject) => {
			let storeName = this.storeName
			let primaryKey = this.stores[storeName].primaryKey
			let key = item[primaryKey]
			if (!key) {
				reject(new Error('primaryKey required!'))
				return
			}

			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readwrite').objectStore(storeName)
				let request = objectStore.add(item)
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	del(key) {
		return new Promise((resolve, reject) => {
			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readwrite').objectStore(storeName)
				let request = objectStore.delete(key)
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	put(item) {
		return new Promise((resolve, reject) => {
			let storeName = this.storeName
			let primaryKey = this.stores[storeName].primaryKey
			let key = item[primaryKey]
			if (!key) {
				reject(new Error('primaryKey required!'))
				return
			}

			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readwrite').objectStore(storeName)
				let request = objectStore.put(item)
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	all() {
		return new Promise((resolve, reject) => {
			this.connect().then(db => {
				let storeName = this.storeName
				let objectStore = db.transaction([storeName], 'readonly').objectStore(storeName)
				let request = objectStore.openCursor()
				let results = []
				request.onsuccess = e => {
					let cursor = e.target.result
					if (cursor) {
						results.push(cursor.value)
						cursor.continue()
					}
					else {
						resolve(results)
					}
				}
				request.onerror = e => {
					reject(e)
				}
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	close() {
		this.connect().then(({db}) => {
			db.close()
		})
	}
}
