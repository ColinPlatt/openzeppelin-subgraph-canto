import {
	Address,
	BigInt
} from '@graphprotocol/graph-ts'

import {
	ERC721Contract,
	ERC721Token,
	ERC721Transfer,
} from '../../generated/schema'

import {
	SINGLE_ID		as SingleEvent,
	RANGE_ID       	as RangeEvent
} from '../../generated/refresher721/NFT_Refresher'

import {
	IERC721,
} from '../../generated/erc721/IERC721'

import {
	fetchAccount,
} from '../fetch/account'

function fetchSimpleERC721(contract: Address, identifier: BigInt): ERC721Token {
	let id = contract.toHex().concat('/').concat(identifier.toHex())
	let token = ERC721Token.load(id)

	token            = new ERC721Token(id)
	token.contract   = contract
	token.identifier = identifier
	token.approval   = fetchAccount(Address.zero()).id

	let erc721       = IERC721.bind(Address.fromBytes(contract))
	let try_tokenURI = erc721.try_tokenURI(identifier)
	token.uri        = try_tokenURI.reverted ? '' : try_tokenURI.value

	return token as ERC721Token
}


export function handleSingle(event: SingleEvent): void {

	let token = fetchSimpleERC721(event.params.collection, event.params.id)

	if (token != null) {

		token.save()
	}
}

export function handleRange(event: RangeEvent): void {

	let start: BigInt = event.params.idStart;
	let end: BigInt = event.params.idEnd;
	let step: BigInt = new BigInt(1);

	let tokens: Array<ERC721Token> = new Array<ERC721Token>(end.minus(start).toU32());
	let i: number = 0;

	for(let id: BigInt = start; id<=end; id = id.plus(step)) {

		tokens[i] = fetchSimpleERC721(event.params.collection, id);
		tokens[i].save()
		i++;
		
	}
}