class IndexDB {
	constructor({name, version, stores, defaultStoreName}) {
		this.name = name
		this.version = version
		this.currentStoreName = defaultStoreName

		let request = indexedDB.open(name, version)
		request.onupgradeneeded = e => {
			let db = e.target.result
			stores.forEach(item => {
				let objectStore = null
				if (db.objectStoreNames.contains(item.name)) {
					objectStore = e.target.transaction.objectStore(item.name)
				}
				else {
					objectStore = db.createObjectStore(item.name, {keyPath: item.primaryKey})
				}

				// delete old indexes
				let indexNames = objectStore.indexNames
				if (indexNames && indexNames.length) {
					Array.from(indexNames).forEach(item => objectStore.deleteIndex(item))
				}

				// add new indexes
				if (item.indexes && item.indexes.length) {
					item.indexes.forEach(item => {
						objectStore.createIndex(item.name, item.key || item.name, {unique: item.unique})
					})
				}
			})
		}
	}
	$connect() {
		return new Promise((resolve, reject) => {
			let request = indexedDB.open(this.name, this.version)
			request.onerror = e => {
				reject(e)
			}
			request.onsuccess = e => {
				resolve(e.target.result)
			}
		})
	}
	/**
	 * @desc switch objectStore
	 */
	use(storeName) {
		this.currentStoreName = storeName
	}
	$store(mode = 'readonly') {
		return new Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
				let objectStore = db.transaction([storeName], mode).objectStore(storeName)
				resolve(objectStore)
			})
			.catch(e => {
				reject(e)
			})
		})
	}
	get(key) {
		return new Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
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
	/**
	 * @desc get objects by index, index key and value should be given
	 */
	query(key, value) {
		return Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
				let objectStore = db.transaction([storeName], 'readonly').objectStore(storeName)
				let objectIndex = objectStore.index(key)
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
			this.$connect().then(db => {
				let storeName = this.currentStoreName
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
	put(item) {
		return new Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
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
	del(key) {
		return new Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
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
	all() {
		return new Promise((resolve, reject) => {
			this.$connect().then(db => {
				let storeName = this.currentStoreName
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
		this.$connect().then(({db}) => {
			db.close()
		})
	}
}
