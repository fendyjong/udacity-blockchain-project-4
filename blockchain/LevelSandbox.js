/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

	constructor() {
		this.db = level(chainDB);
	}

	/**
	 * Get data frol levelDB with key
	 *
	 * @param key
	 * @returns {Promise<any>}
	 */
	getLevelDBData(key) {
		let self = this; // Because we are returning a promise, we will need this to be able to reference 'this' inside the Promise constructor
		return new Promise(function (resolve, reject) {
			self.db.get(key, (err, value) => {
				if (err) {
					if (err.type == 'NotFoundError') {
						resolve(undefined);
					} else {
						console.log('Block ' + key + ' get failed', err);
						reject(err);
					}
				} else {
					resolve(JSON.parse(value));
				}
			});
		});
	}

	/**
	 * Get data from levelDB with block hash
	 *
	 * @param hash
	 * @returns {Promise<any>}
	 */
	getBlockByHash(hash) {
		let self = this; // Because we are returning a promise, we will need this to be able to reference 'this' inside the Promise constructor
		let block = undefined;
		return new Promise(function (resolve, reject) {
			self.db.createReadStream()
				.on('data', function (data) {
					const value = JSON.parse(data.value);
					if (value.hash === hash) {
						block = value;
					}
				})
				.on('error', function (err) {
					console.error('Oh my!', err);
				})
				.on('close', function () {
					resolve(block);
				});
		});
	}

	/**
	 * Get block by wallet address
	 *
	 * @param address
	 * @returns {Promise<any>}
	 */
	getBlockByAddress(address) {
		let self = this; // Because we are returning a promise, we will need this to be able to reference 'this' inside the Promise constructor
		let blocks = [];
		return new Promise(function (resolve, reject) {
			self.db.createReadStream()
				.on('data', function (data) {
					const value = JSON.parse(data.value);
					if (value.body.address === address) {
						blocks.push(value);
					}
				})
				.on('error', function (err) {
					console.error('Oh my!', err);
				})
				.on('close', function () {
					resolve(blocks);
				});
		});
	}

	/**
	 * Add data to levelDB with key and value
	 *
	 * @param key
	 * @param value
	 * @returns {Promise<any>}
	 */
	addLevelDBData(key, value) {
		let self = this;
		return new Promise(function (resolve, reject) {
			self.db.put(key, value, function (err) {
				if (err) {
					console.log('Block ' + key + ' submission failed', err);
					reject(err);
				}
				resolve(JSON.parse(value));
			});
		});
	}

	/**
	 * Get blockchain height
	 *
	 * @returns {Promise<any>}
	 */
	getBlocksCount() {
		let self = this;
		// Add your code here
		return new Promise(function (resolve, reject) {
			let height = 0;
			self.db.createReadStream()
				.on('data', function (data) {
					height++;
				})
				.on('error', function (err) {
				})
				.on('close', function () {
				})
				.on('end', function (err) {
					resolve(height);
				});
		});
	}
}

module.exports.LevelSandbox = LevelSandbox;
