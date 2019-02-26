/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const hex2ascii = require('hex2ascii');
const LevelSandbox = require('./LevelSandbox');
const Block = require('./Block');

const { currentTimestamp } = require('../helper');

class Blockchain {
	constructor() {
		this.bd = new LevelSandbox.LevelSandbox();
		this.mempools = [];
		this.timeoutRequests = {};

		// testing: set defaultTimeoutRequest to 3 sec
		this.defaultTimeoutRequest = 5 * 60;
	}

	/**
	 * Create genesis block
	 *
	 * @returns {Promise<void>}
	 */
	async generateGenesisBlock() {
		// get height from db
		const genesisBlock = new Block.Block('Genesis block');
		genesisBlock.height = 0;
		genesisBlock.time = currentTimestamp();
		genesisBlock.hash = SHA256(JSON.stringify(genesisBlock)).toString();
		await this.bd.addLevelDBData(genesisBlock.height, JSON.stringify(genesisBlock));
	}

	/**
	 * Get block height, it is a helper method that return the height of the blockchain
	 *
	 * @returns {Promise<void>}
	 */
	async getBlockHeight() {
		return await this.bd.getBlocksCount();
	}

	/**
	 * Add new block
	 *
	 * @param block
	 * @returns {Promise<undefined>}
	 */
	async addBlock(block) {
		const height = await this.getBlockHeight();
		if (height === 0) {
			// Generate genesis block
			await this.generateGenesisBlock();
		}
		// verify request
		if (this.isRequestVerified(block.body.address)) {
			// Encode star story
			block.body.star.story = Buffer(block.body.star.story).toString('hex');

			// block height
			block.height = await this.getBlockHeight();

			// UTC timestamp
			block.time = currentTimestamp();
			if (block.height > 0) {
				// previous block hash
				const previousBlock = await this.getBlock(block.height - 1);
				block.previousBlockHash = previousBlock.hash;
			}
			// SHA256 requires a string of data
			block.hash = SHA256(JSON.stringify(block)).toString();

			const result = await this.bd.addLevelDBData(block.height, JSON.stringify(block));

			if (result) {
				// remove request from mempools
				this.removeRequestFromMempools(block.body.address);
				return result;
			}
		}
		return undefined;
	}

	/**
	 * Get block by height
	 *
	 * @param height
	 * @returns {Promise<undefined>}
	 */
	async getBlock(height) {
		try {
			let block = await this.bd.getLevelDBData(height);
			if (height > 0) {
				// decode star story
				block.body.star.storyDecoded = hex2ascii(block.body.star.story);
			}
			return block;
		} catch (e) {
			return undefined;
		}
	}

	/**
	 * Get block by hash
	 *
	 * @param hash
	 * @returns {Promise<undefined>}
	 */
	async getBlockByHash(hash) {
		try {
			let block = await this.bd.getBlockByHash(hash);

			if (block.height > 0) {
				// Decode star story if block is not genesis block
				block.body.star.storyDecoded = hex2ascii(block.body.star.story);
			}

			return block;
		} catch (e) {
			return undefined;
		}
	}

	/**
	 * Get block by wallet address
	 *
	 * @param address
	 * @returns {Promise<undefined>}
	 */
	async getBlockByAddress(address) {
		try {
			let blocks = await this.bd.getBlockByAddress(address);

			// decode star story
			blocks = blocks.map(block => {
				// decode star story
				block.body.star.storyDecoded = hex2ascii(block.body.star.story);
				return block;
			});

			return blocks;
		} catch (e) {
			return undefined;
		}
	}

	/**
	 * Validate if Block is being tampered by Block Height
	 *
	 * @param height
	 * @returns {Promise<boolean>}
	 */
	async validateBlock(height) {
		// block is valid if the block hash is the same as SHA256 of that block
		const currentBlock = await this.getBlock(height);
		const nextBlock = await this.getBlock(height + 1);

		const block = JSON.parse(JSON.stringify(currentBlock));
		block.hash = '';

		const blockHash = SHA256(JSON.stringify(block)).toString();

		return blockHash === nextBlock.previousBlockHash && currentBlock.hash === blockHash;
	}

	/**
	 * Validate blockchain
	 *
	 * @returns {Promise<Array>}
	 */
	async validateChain() {
		// Loop through all blocks in the chain
		const lastHeight = await this.getBlockHeight();
		const promises = [];
		const errorLog = [];
		for (let i = 1; i < lastHeight - 1; i++) {
			promises.push(this.validateBlock(i).then(valid => {
				if (!valid) {
					errorLog.push({
						height: i,
						error: 'Invalid block!',
					});
				}
			}));
		}

		return await Promise.all(promises).then(() => errorLog);
	}

	/**
	 * Is address valid?
	 *
	 * @param address
	 */
	isAddressValid(address) {
		try {
			bitcoin.address.toOutputScript(address);
			return true;
		} catch (e) {
			console.error(e);
			return false;
		}
	}

	requestValidation(address) {
		if (this.isAddressValid(address)) {
			if (!this.isRequestInMempools(address)) {
				const requestTimeStamp = currentTimestamp();
				// Timeout request in milliseconds

				const request = {
					walletAddress: address,
					requestTimeStamp,
					message: `${address}:${requestTimeStamp}:starRegistry`,
					validationWindow: this.defaultTimeoutRequest,
				};

				// Add request to mempool
				this.updateRequestInMempools(request);

				// add timeout request to count down and remove from mempools
				this.timeoutRequest(address);
			} else if (this.timeoutRequests[address]) {
				this.updateRequestValidationWindow(address);
			}

			// return request object
			return this.getRequest(address);
		}
		return undefined;
	}

	/**
	 * Validate if the request still exist in mempools.
	 *
	 * @param address
	 * @returns {boolean}
	 */
	isRequestInMempools(address) {
		return this.mempools.filter(mempool => mempool.walletAddress === address).length > 0;
	}

	/**
	 * Check if request has been verified
	 *
	 * @param address
	 * @returns {boolean}
	 */
	isRequestVerified(address) {
		return this.mempools.filter(mempool => mempool.walletAddress === address && mempool.registerStar).length > 0;
	}

	/**
	 * Update request validationWindow timer
	 *
	 * @param address
	 */
	updateRequestValidationWindow(address) {
		// Update request in mempools to reduce the validationWindow.
		// get request from mempools
		const request = this.getRequest(address);

		// recalculate timeoutRequest
		const TimeoutRequestsWindowTime = this.defaultTimeoutRequest;

		let timeElapse = currentTimestamp() - request.requestTimeStamp;
		request.validationWindow = (TimeoutRequestsWindowTime) - timeElapse;

		// finally update request to mempools
		this.updateRequestInMempools(request);
	}

	/**
	 * Add or update request in mempools.
	 * @param request
	 */
	updateRequestInMempools(request) {
		this.removeRequestFromMempools(request.walletAddress);
		this.mempools.push(request);
	}

	/**
	 * Remove request from mempools.
	 * @param address
	 */
	removeRequestFromMempools(address) {
		this.mempools = this.mempools.filter(mempool => !mempool.walletAddress === address);
	}

	/**
	 * Upon timeout of request.validationWindow, remove request from mempools.
	 *
	 * @param address
	 */
	timeoutRequest(address) {
		this.timeoutRequests[address] = setTimeout(() => this.removeRequestFromMempools(address), this.defaultTimeoutRequest * 1000);
	}

	removeTimeoutRequest(address) {
		delete this.timeoutRequests[address];
	}

	/**
	 * Get request in mempools by address.
	 * @param address
	 * @returns request object
	 */
	getRequest(address) {
		return this.mempools.filter(mempool => mempool.walletAddress === address)[0];
	}

	/**
	 * Validate request in mempools by address and signature
	 *
	 * @param address
	 * @param signature
	 */
	validateRequestByAddressAndSignature(address, signature) {
		/*
		{
			"registerStar": true,
			"status": {
					"address": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL",
					"requestTimeStamp": "1544454641",
					"message": "19xaiMqayaNrn3x7AjV5cU4Mk5f5prRVpL:1544454641:starRegistry",
					"validationWindow": 193,
					"messageSignature": true
			}
		}
		 */
		if (this.isRequestInMempools(address)) {
			const request = this.getRequest(address);

			const verified = bitcoinMessage.verify(request.message, address, signature);
			if (verified) {
				this.removeTimeoutRequest(address);
				request.registerStar = true;
				this.updateRequestInMempools(request);
				return {
					registerStar: true,
					status: {
						address: request.walletAddress,
						requestTimeStamp: request.requestTimeStamp,
						message: request.message,
						validationWindow: request.validationWindow,
						messageSignature: true,
					},
				};
			}
		}
		return undefined;
	}

}

module.exports.Blockchain = Blockchain;
