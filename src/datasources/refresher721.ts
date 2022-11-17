import {
	Address,
	BigInt
} from '@graphprotocol/graph-ts'

import {
	ERC721Transfer,
} from '../../generated/schema'

import {
	SINGLE_ID		as SingleEvent,
	RANGE_ID       	as RangeEvent,
	MULTI_ID       	as MultiEvent
} from '../../generated/refresher721/NFT_Refresher'

import {
	events,
	transactions,
} from '@amxx/graphprotocol-utils'

import {
	fetchAccount,
} from '../fetch/account'

import {
	fetchERC721,
	fetchERC721Token
} from '../fetch/erc721'

export function handleSingle(event: SingleEvent): void {
	let contract = fetchERC721(event.params.collection)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params.id)

		contract.save()
		token.save()
	}
}

export function handleRange(event: RangeEvent): void {
	let contract = fetchERC721(event.params.collection)
	if (contract != null) {
		let start: BigInt = event.params.idStart;
		let end: BigInt = event.params.idEnd;
		let step: BigInt = new BigInt(1);
		for(let i: BigInt = start; i<=end; i.plus(step)) {

			let token = fetchERC721Token(contract, i)
			token.save()

		}
		contract.save()
	}
}

export function handleMulti(event: MultiEvent): void {
	//inactive
}