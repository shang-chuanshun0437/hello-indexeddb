export default class HelloIndexedDB {
	constructor(options) {
		let { name = 'HelloIndexedDB', version = 1, stores, use = 'HelloIndexedDB' } = options || {}

		if (!stores) {
			stores = [
				{ 
					name: use,
					isKeyValue: true,
				},
			]
		}

		this.name = name
		this.version = version

		this.currentObjectStore = use
		this._runtimes = {}
		
		let request = self.indexedDB.open(name, version)
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
					let keyPath = item.isKeyValue ? 'key' : item.keyPath
					objectStore = db.createObjectStore(item.name, { keyPath, autoIncrement: item.autoIncrement })
				}

				// delete old indexes
				let indexNames = objectStore.indexNames
				if (indexNames && indexNames.length) {
					Array.from(indexNames).forEach((item) => objectStore.deleteIndex(item))
				}

				// add new indexes
				if (item.indexes && item.indexes.length) {
					item.indexes.forEach((item) => {
						objectStore.createIndex(item.name, item.keyPath || item.name, { unique: item.unique, multiEntry: Array.isArray(item.keyPath) })
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
			let request = self.indexedDB.open(this.name, this.version)
			request.onerror = (e) => {
				reject(e)
			}
			request.onsuccess = (e) => {
				resolve(e.target.result)
			}
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
	transaction(name, mode = 'readonly') {
		const wrap = (tx) => {
			let runtime = {
				mode,
				tx,
				expire: () => {},
				state: 1,
			}
			runtime.defer = new Promise((resolve) => {
				runtime.expire = () => {
					resolve()
					runtime.state = 0
				}
			})
			return runtime
		}
		const request = () => {
			return this.connect().then((db) => {
				let tx = db.transaction(name, mode)
				this._runtimes[name] = wrap(tx)
				tx.oncomplete = () => {
					this._runtimes[name].expire()
				}
				tx.onerror = () => {
					this._runtimes[name].expire()
				}
				tx.onabort = () => {
					this._runtimes[name].expire()
				}
				return tx
			})
		}

		// if a written transaction is running, wait until it finish
		if (this._runtimes[name] && this._runtimes[name].state && this._runtimes[name].mode === 'readwrite') {
			return this._runtimes[name].defer.then(request)
		}
		
		return request()
	}
	// =======================================
	objectStore() {
		let name = this.currentObjectStore
		return this.transaction(name).then(tx => tx.objectStore(name))
	}
	keyPath() {
		return this.objectStore().keyPath
	}
	request(prepare, success, error, mode = 'readonly') {
		let name = this.currentObjectStore
		return this.transaction(name, mode).then((tx) => {
			let objectStore = tx.objectStore(name)
			let request = prepare(objectStore)
			request.onsuccess = (e) => {
				success(e.target.result)
			}
			request.onerror = (e) => {
				error(e)
			}
		}).catch((e) => {
			error(e)
		})
	}
	each(fn, direction) {
		return new Promise((resolve, reject) => {
			let i = 0
			this.request(
				objectStore => objectStore.openCursor(null, direction),
				cursor => {
					if (cursor) {
						fn(cursor.value, i ++, cursor, resolve, reject)
						if (fn.length < 3) {
							cursor.continue()
						}
					}
					else {
						resolve()
					}
				},
				reject,
			)
		})
	}
	reverse(fn) {
		return this.each(fn, 'prev')
	}
	// ==========================================
	get(key) {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.get(key), (data) => {
				// if the keys is certain structure, which is used to find value of `set(key, value)`
				if (typeof data === 'object') {
					let keys = Object.keys(data)
					keys.sort()
					if (JSON.stringify(keys) === '["__type__","key","value"]' && data.__type__ === '$key->$value') {
						resolve(data.value)
						return
					}
				}

				resolve(data)
			}, reject)
		})
	}
	keys() {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.getAllKeys(), resolve, reject)
		})
	}
	all() {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.getAll(), resolve, reject)
		})
	}
	first() {
		return new Promise((resolve, reject) => {
			this.each((item, i, cursor, finish) => {
				finish()
				resolve(item)
			}).catch(reject)
		})
	}
	last() {
		return new Promise((resolve, reject) => {
			this.reverse((item, i, cursor, finish) => {
				finish()
				resolve(item)
			}).catch(reject)
		})
	}
	some(count = 10, offset = 0) {
		return new Promise((resolve, reject) => {
			if (offset > 0) {
				let results = []
				this.each((item, index, cursor, finish) => {
					if (index >= offset) {
						results.push(item)
					}
					if (index >= offset + count) {
						finish()
						resolve(results)
						return
					}
					cursor.continue()
				}).then(() => resolve(results)).catch(reject)
				return
			}
			this.request(objectStore => objectStore.getAll(null, count), resolve, reject)
		})
	}
	count() {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.count(), resolve, reject)
		})
	}
	// ==========================================
	find(key, value) {
		return new Promise((resolve, reject) => {
			this.request(
				objectStore => {
					let index = objectStore.index(key)
					return index.get(value)
				},
				resolve, 
				reject
			)
		})
	}
	query(key, value, compare) {
		return new Promise((resolve, reject) => {
			let range = (function() {
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
			let results = []
			this.request(
				objectStore => {
					let index = objectStore.index(key)
					return index.openCursor(range)
				},
				cursor => {
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
				}, 
				reject,
			)
		})
	}
	select(conditions) {
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
		let results = []
		return this.each((value) => {
			if (determine(value)) {
				results.push(value)
			}
		}).then(() => results)
	}
	// =====================================
	add(obj) {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.add(obj), resolve, reject, 'readwrite')
		})
	}
	put(obj) {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.put(obj), resolve, reject, 'readwrite')
		})
	}
	set(key, value) {
		return new Promise((resolve, reject) => {
			this.request(
				objectStore => objectStore.put({ key, value, __type__: '$key->$value' }),
				resolve,
				reject,
				'readwrite'
			)
		})
	}
	delete(key) {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.delete(key), resolve, reject, 'readwrite')
		})
	}
	clear() {
		return new Promise((resolve, reject) => {
			this.request(objectStore => objectStore.clear(), resolve, reject, 'readwrite')
		})
	}
}
