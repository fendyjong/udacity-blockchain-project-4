/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block {
	constructor(data) {
		this.height = '';
		this.time = '';
		this.body = data;
		this.previousBlockHash = '0x';
		this.hash = '';
	}
}

module.exports.Block = Block;
