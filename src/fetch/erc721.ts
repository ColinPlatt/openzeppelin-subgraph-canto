import {
	Address,
	bigInt,
	BigInt,
	Bytes,
	ipfs,
	json,
	JSONValue,
	TypedMap
} from '@graphprotocol/graph-ts'

import {
	Account,
	ERC721Contract,
	ERC721Token,
	ERC721Operator,
	ERC721Metadata,
	ERC721Attribute
} from '../../generated/schema'

import {
	IERC721,
} from '../../generated/erc721/IERC721'

import {
	fetchAccount
} from './account'

import {
	supportsInterface,
} from './erc165'


export function fetchERC721(address: Address): ERC721Contract | null {
	let erc721   = IERC721.bind(address)

	// Try load entry
	let contract = ERC721Contract.load(address)
	if (contract != null) {
		fetchERC721Supply(address)
		return contract
	}

	// Detect using ERC165
	let detectionId      = address.concat(Bytes.fromHexString('80ac58cd')) // Address + ERC721
	let detectionAccount = Account.load(detectionId)

	// On missing cache
	if (detectionAccount == null) {
		detectionAccount = new Account(detectionId)
		let introspection_01ffc9a7 = supportsInterface(erc721, '01ffc9a7') // ERC165
		let introspection_80ac58cd = supportsInterface(erc721, '80ac58cd') // ERC721
		//let introspection_00000000 = supportsInterface(erc721, '00000000', false)
		let isERC721               = introspection_01ffc9a7 && introspection_80ac58cd // && introspection_00000000
		detectionAccount.asERC721  = isERC721 ? address : null
		detectionAccount.save()
	}

	// If an ERC721, build entry
	if (detectionAccount.asERC721) {
		contract                  = new ERC721Contract(address)
		let try_name              = erc721.try_name()
		let try_symbol            = erc721.try_symbol()
		contract.name             = try_name.reverted   ? '' : try_name.value
		contract.symbol           = try_symbol.reverted ? '' : try_symbol.value
		contract.supportsMetadata = supportsInterface(erc721, '5b5e139f') // ERC721Metadata
		let isERC721Enumerable 	  = supportsInterface(erc721, '780e9d63') // ERC721Enumerable
		contract.isEnumerable	  = isERC721Enumerable
		contract.totalSupply 	  = isERC721Enumerable? erc721.try_totalSupply().value : BigInt.fromI32(0)
		contract.asAccount        = address		
		contract.save()

		let account               = fetchAccount(address)
		account.asERC721          = address
		account.save()
	}

	return contract
}

function fetchERC721Supply(address: Address): ERC721Contract | null {
	let erc721   = IERC721.bind(address)

	// Try load entry
	let contract = ERC721Contract.load(address)
	if (contract != null) {
		if (contract.isEnumerable) {
			contract.totalSupply = erc721.try_totalSupply().value
			contract.save()
		}
		return contract
	}

	return contract
}

export function fetchERC721Token(contract: ERC721Contract, identifier: BigInt): ERC721Token {
	let id = contract.id.toHex().concat('/').concat(identifier.toHex())
	let token = ERC721Token.load(id)

	if (token == null) {
		token            	= new ERC721Token(id)
		token.contract   	= contract.id
		token.identifier 	= identifier
		token.approval   	= fetchAccount(Address.zero()).id
	}

	if (contract.supportsMetadata) {
		let erc721       = IERC721.bind(Address.fromBytes(contract.id))
		let try_tokenURI = erc721.try_tokenURI(identifier)
		token.uri        = try_tokenURI.reverted ? '' : try_tokenURI.value
	}

	fetchERC721Metadata(token)

	return token as ERC721Token
}

export function fetchERC721Operator(contract: ERC721Contract, owner: Account, operator: Account): ERC721Operator {
	let id = contract.id.toHex().concat('/').concat(owner.id.toHex()).concat('/').concat(operator.id.toHex())
	let op = ERC721Operator.load(id)

	if (op == null) {
		op          = new ERC721Operator(id)
		op.contract = contract.id
		op.owner    = owner.id
		op.operator = operator.id
	}

	return op as ERC721Operator
}

// need to be able to handle :
// base64
// ipfs (with/without JSON)
// ar
// centralized

enum dataType {
	base64,
	onchainUnencoded,
	ipfs,
	arweave,
	centralized,
	unsupported
}

function determineData(uri: string | null): dataType {
	if(uri) {
		if (uri.startsWith('data:application/json;base64')) 			return dataType.base64;
		if (uri.startsWith('{"name": '))								return dataType.onchainUnencoded;
		if (uri.includes('ipfs')) 										return dataType.ipfs;

		//if (uri.startsWith('ar://')) 									return dataType.arweave;
		//if (uri.startsWith('http://') || uri.startsWith('https://')) 	return dataType.centralized;
	}

	return dataType.unsupported as dataType;

}

function correctJSON(uri: string): string {
	if (uri.endsWith('.json')) {
		return uri;
	} else {
		return uri + ".json";
	}
}

function decodeBase64(uri: string): string {
	return Buffer.from(uri.split("base64,")[1], 'base64').toString('ascii');
}

function formatMetadata(uri: string | null, metadataType: dataType): TypedMap<string, JSONValue> | null {
	let formattedMetadata: TypedMap<string, JSONValue> | null
	let response: Bytes | null

	if(uri){
		// get the metadata string into a common format
		switch(metadataType) 
		{
			case dataType.ipfs:
				uri = correctJSON(uri)
				response = ipfs.cat(uri)
				if (response) {
					formattedMetadata = json.fromBytes(response).toObject()
				}
				break;
			/*case dataType.arweave:
				uri = correctJSON(uri)
				break;
			case dataType.centralized:
				uri = correctJSON(uri)
				response = http.get(uri)
				if (response) {
					formattedMetadata = json.fromBytes(response).toObject()
				}
				break;
			case dataType.base64:
				formattedMetadata = decodeBase64(uri)
				break;
			case dataType.onchainUnencoded:
				formattedMetadata = uri
				break;*/
			default:
				return null;
		}
	}

	return null

}


export function fetchERC721Metadata(token: ERC721Token): ERC721Metadata | null {

	let erc721metadata = ERC721Metadata.load(token.id)
	let uri = token.uri

	// if there is no entry just leave
	if (uri == null) {
		return erc721metadata
	}

	if (erc721metadata == null) {
		erc721metadata      	= new ERC721Metadata(token.id)
		erc721metadata.token 	= token.id
	}

	let metadataType: dataType = determineData(uri);

	erc721metadata.metadataIndex = metadataType.valueOf
	
	let formattedMetadata = formatMetadata(uri, metadataType)

	if (formattedMetadata) {
		const image = formattedMetadata.get('image')
        const name = formattedMetadata.get('name')
        const description = formattedMetadata.get('description')
        const externalURL = formattedMetadata.get('external_url')

		erc721metadata.name = name? name.toString(): ''
		erc721metadata.image = image? image.toString(): ''
		erc721metadata.external_uri = externalURL? externalURL.toString(): ''
		erc721metadata.description = description? description.toString(): ''

		const attributes = formattedMetadata.get('attributes')

		if(attributes) {
			let nextAttr: ERC721Attribute = new ERC721Attribute(erc721metadata.id);
			const attributeData = attributes.toObject();
			for (let i = 0; i<attributeData.entries.length; i++) {
				nextAttr.metadata = erc721metadata.id;
				nextAttr.trait_type = attributeData.entries[i].key.toString()
				nextAttr.value = attributeData.entries[i].value.toString()
				nextAttr.save()
			}
		}

	}

	erc721metadata.save()

	return erc721metadata;
}
