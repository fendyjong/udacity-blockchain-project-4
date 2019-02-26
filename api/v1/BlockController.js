const SHA256 = require('crypto-js/sha256');
const Block = require('../../blockchain/Block');
const BlockChain = require('../../blockchain/BlockChain');
const helper = require('../../helper');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {
	/**
	 * Constructor to create a new BlockController, you need to initialize here all your endpoints
	 * @param {*} app
	 */
	constructor(app) {
		// TODO try to find a way to use router with this class.
		this.urlPrefix = '';
		this.myBlockChain = new BlockChain.Blockchain();

		this.app = app;
		this.getBlockByIndex();
		this.postNewBlock();

		this.requestValidation();
		this.validateRequestByWallet();
		this.getStar();
	}

	/**
	 * Implement a GET Endpoint to retrieve a block by index.
	 *
	 * URL:
	 * /block/[index]
	 */
	getBlockByIndex() {
		this.app.get(`${this.urlPrefix}/block/:id`, async (req, res) => {
			let blockId = req.params.id;

			// validate if block id is numeric
			if (helper.isNumeric(blockId)) {
				// parse block id string to integer
				blockId = parseInt(blockId);

				// get block data
				const block = await this.myBlockChain.getBlock(blockId);

				if (block) {
					res.json(block);
				} else {
					res.sendStatus(404);
				}
			} else {
				res.sendStatus(400);
			}
		});
	}

	/**
	 * Implement a GET Endpoint to retrieve a star by query hash or address.
	 *
	 * URL:
	 * /stars/hash:[hash]
	 * /stars/address:[address]
	 */
	getStar() {
		this.app.get(`${this.urlPrefix}/stars/:query`, async (req, res) => {
			const query = req.params.query.split(':');

			if (query.length === 2) {
				const param = query[0];
				const value = query[1];

				let block = undefined;

				switch (param) {
					case 'hash' :
						block = await this.myBlockChain.getBlockByHash(value);
						break;
					case 'address':
						block = await this.myBlockChain.getBlockByAddress(value);
						break;
				}

				if (block) {
					res.json(block);
				} else {
					res.sendStatus(404);
				}
			} else {
				res.sendStatus(400);
			}
		});
	}

	/**
	 * Implement a POST Endpoint to add a new Block, url: "/block"
	 *
	 * Example Request JSON:
	 * {
	 *   "address": [address],
	 *   "star": {
	 *     "dec": [dec],
	 *     "ra": [ra],
	 *     "story": [story]
	 *   }
	 * }
	 */
	postNewBlock() {
		this.app.post(`${this.urlPrefix}/block`, async (req, res) => {
			const { address, star } = req.body;

			if (address && star && !star.length) {
				try {
					// add new block to blockchain
					let block = new Block.Block({ address, star });
					block = await this.myBlockChain.addBlock(block);

					if (block) {
						res.status(201).json(block);
					} else {
						res.sendStatus(403);
					}
				} catch (e) {
					res.sendStatus(500);
				}
			} else {
				res.sendStatus(400);
			}
		});
	}

	/**
	 * Implement a Post Endpoint to send request for validation, url: "/requestValidation
	 *
	 * Example Request JSON:
	 * {
	 *   "address": [address]
	 * }
	 */
	requestValidation() {
		this.app.post(`${this.urlPrefix}/requestValidation`, (req, res) => {
			const { address } = req.body;

			if (address) {
				const request = this.myBlockChain.requestValidation(address);
				if (request) {
					res.json(request);
				} else {
					res.sendStatus(500);
				}
			} else {
				res.sendStatus(400);
			}
		});
	}

	/**
	 * Implement a Post Endpoint to validate requested message in mempools, url: "/message-signature/validate"
	 *
	 * Example Request JSON:
	 * {
	 *   "address": [address],
	 *   "signature": [signature]
	 * }
	 */
	validateRequestByWallet() {
		this.app.post(`${this.urlPrefix}/message-signature/validate`, (req, res) => {
			const { address, signature } = req.body;
			if (address && signature) {
				const verifiedRequest = this.myBlockChain.validateRequestByAddressAndSignature(address, signature);
				if (verifiedRequest) {
					res.json(verifiedRequest);
				} else {
					res.status(404).send("Invalid Signature");
				}
			} else {
				res.sendStatus(400);
			}
		});
	}
}

/**
 * Exporting the BlockController class
 * @param {*} app
 */
module.exports = (app) => {
	return new BlockController(app);
};
