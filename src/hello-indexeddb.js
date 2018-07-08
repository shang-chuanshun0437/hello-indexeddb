export default class HelloIndexedDB {
	constructor({ name, version, stores, use }) {
		this.name = name
		this.version = version

		this.currentObjectStore = use
		this._runtimes = {}
		
		let request = indexedDB.open(name, version)
		request.onupgradeneeded = e => {
			let db = e.target.result
			let existStoreNames = Array.from(db.objectStoreNames)
			let passStoreNames = []

			stores.forEach((item) => {
				let objectStore = null
				if (existStoreNames.indexOf(item.name) > -1) {
					objectStore = e.target.transaction.objectStore(item.name)
				}
				else {
					objectStore = db.createObjectStore(item.name, {keyPath: item.primaryKey})
				}

				// delete old indexes
				let indexNames = objectStore.indexNames
				if (indexNames && indexNames.length) {
					Array.from(indexNames).forEach((item) => objectStore.deleteIndex(item))
				}

				// add new indexes
				if (item.indexes && item.indexes.length) {
					item.indexes.forEach((item) => {
						objectStore.createIndex(item.name, item.key || item.name, { unique: item.unique })
					})
				}

				passStoreNames.push(item.name)
			})

			// delete objectStores which is not in config information
			if (existStoreNames) {
				existStoreNames.forEach((item) => {
					if (passStoreNames.indexOf(item) === -1) {
						db.deleteObjectStore(item)
					}
				})
			}
		}
	}
	connect() {
		return new Promise((resolve, reject) => {
			let request = indexedDB.open(this.name, this.version)
			request.onerror = (e) => {
				reject(e)
			}
			request.onsuccess = (e) => {
				resolve(e.target.result)
			}
		})
	}
	transaction(name, mode = 'readonly') {
		return this.connect().then((db) => {
			return db.transaction([name], mode)
		})
	}
	store(name, mode = 'readonly') {
		if (mode === 'readwrite' && this._runtimes[name]) {
			return this._runtimes[name].objectStore(name)
		}

		return this.transaction(name, mode).then((tx) => {
			if (mode === 'readwrite') {
				this._runtimes[name] = tx
			}
			return tx.objectStore(name)
		})
	}
	use(name) {
		return new HelloIndexedDB({
			name: this.name,
			version: this.version,
			use: name,
		})
	}
	close() {
		this._runtimes = null
		return this.connect().then((db) => {
			db.close()
		})
	}
	// ==========================================
	get(key) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let request = objectStore.get(key)
				request.onsuccess = (e) => {
					resolve(e.target.result)
				}
				request.onerror = (e) => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	find(key, value) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let index = objectStore.index(key)
				let request = index.get(value)
				request.onsuccess = (e) => {
					resolve(e.target.result)
				}
				request.onerror = (e) => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	query(key, value, compare) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let range = (function(){
					switch (compare) {
						case '>':
							return IDBKeyRange.lowerBound(value, true)
						case '>=': 
							return IDBKeyRange.lowerBound(value)
						case '<':
							return IDBKeyRange.upperBound(value, true)
						case '<=':
							return IDBKeyRange.upperBound(value)
						case '%':
						case '!=':
							return undefined
						default:
							return IDBKeyRange.only(value)
					}
				}())
				let index = objectStore.index(key)
				let request = index.openCursor(range)
				let results = []
				request.onsuccess = (e) => {
					let cursor = e.target.result
					if (cursor) {
						if (compare === '!=') {
							if (cursor.value[key] !== value) {
								results.push(cursor.value)
							}
						}
						else if (compare === '%') {
							if (typeof cursor.value[key] == 'string' && cursor.value[key].indexOf(value) > -1) {
								results.push(cursor.value)
							}
						}
						else {
							results.push(cursor.value)
						}
						cursor.continue()
					}
					else {
						resolve(results)
					}
				}
				request.onerror = (e) => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	select(conditions) {
		let name = this.currentObjectStore
		let determine = function(obj) {
			let or_conditions = []
			let and_conditions = []
			let compareAandB = function(a, b, compare) {
				if (a === undefined) {
					return false
				}
				switch (compare) {
					case '>':
						return a > b
					case '>=': 
						return a >= b
					case '<':
						return a < b
					case '<=':
						return a <= b
					case '%':
						return typeof a === 'string' && a.indexOf(b) > -1
					case '!=':
						return a !== b
					default:
						return a === b
				}
			}
			for (let i = 0, len = conditions.length; i < len; i ++) {
				let { key, value, compare, optional } = conditions[i]
				if (optional) {
					or_conditions.push({ key, value, compare })
				}
				else {
					and_conditions.push({ key, value, compare })
				}
			}
			for (let i = 0, len = and_conditions.length; i < len; i ++) {
				let { key, value, compare } = and_conditions[i]
				if (!compareAandB(obj[key], value, compare)) {
					return false
				}
			}
			for (let i = 0, len = or_conditions.length; i < len; i ++) {
				let { key, value, compare } = or_conditions[i]
				if (compareAandB(obj[key], value, compare)) {
					return true
				}
			}
			return false
		}
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let request = objectStore.openCursor()
				let results = []
				request.onsuccess = (e) => {
					let cursor = e.target.result
					if (cursor) {
						if (determine(cursor.value)) {
							results.push(cursor.value)
						}
						cursor.continue()
					}
					else {
						resolve(results)
					}
				}
				request.onerror = (e) => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	all() {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let request = objectStore.openCursor()
				let results = []
				request.onsuccess = (e) => {
					let cursor = e.target.result
					if (cursor) {
						results.push(cursor.value)
						cursor.continue()
					}
					else {
						resolve(results)
					}
				}
				request.onerror = (e) => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	count() {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name).then((objectStore) => {
				let request = objectStore.count()
				request.onsuccess = e => {
					resolve(e.target.result)
				}
				request.onerror = e => {
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	// =====================================
	add(obj) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name, 'readwrite').then((objectStore) => {
				let request = objectStore.add(obj)
				request.onsuccess = (e) => {
					this._runtimes[name] = null
					resolve(e.target.result)
				}
				request.onerror = (e) => {
					this._runtimes[name] = null
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	put(obj) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name, 'readwrite').then((objectStore) => {
				let request = objectStore.put(obj)
				request.onsuccess = (e) => {
					this._runtimes[name] = null
					resolve(e.target.result)
				}
				request.onerror = (e) => {
					this._runtimes[name] = null
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
	delete(key) {
		let name = this.currentObjectStore
		return new Promise((resolve, reject) => {
			this.store(name, 'readwrite').then((objectStore) => {
				let request = objectStore.delete(key)
				request.onsuccess = (e) => {
					this._runtimes[name] = null
					resolve(e.target.result)
				}
				request.onerror = (e) => {
					this._runtimes[name] = null
					reject(e)
				}
			}).catch((e) => {
				reject(e)
			})
		})
	}
}