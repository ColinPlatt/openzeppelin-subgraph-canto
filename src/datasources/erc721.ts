import {
	Address,
	BigInt,
	Bytes,
	ethereum
} from '@graphprotocol/graph-ts'

import {
	ERC721Transfer,
} from '../../generated/schema'

import {
	Approval       as ApprovalEvent,
	ApprovalForAll as ApprovalForAllEvent,
	Transfer       as TransferEvent,
} from '../../generated/erc721/IERC721'

import {
	events,
	transactions,
} from '@amxx/graphprotocol-utils'

import {
	fetchAccount,
} from '../fetch/account'

import {
	fetchERC721,
	fetchERC721Token,
	fetchERC721Operator,
} from '../fetch/erc721'


const woof: Address = new Address(0xDE7Aa2B085bef0d752AA61058837827247Cc5253);
const max: BigInt = new BigInt(1120);
const one: BigInt = new BigInt(1);


export function handleTransfer(event: TransferEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token = fetchERC721Token(contract, event.params.tokenId)
		let from  = fetchAccount(event.params.from)
		let to    = fetchAccount(event.params.to)

		token.owner    = to.id
		token.approval = fetchAccount(Address.zero()).id // implicit approval reset on transfer

		contract.save()
		token.save()

		let ev         = new ERC721Transfer(events.id(event))
		ev.emitter     = contract.id
		ev.transaction = transactions.log(event).id
		ev.timestamp   = event.block.timestamp
		ev.contract    = contract.id
		ev.token       = token.id
		ev.from        = from.id
		ev.to          = to.id
		ev.save()

		// if we are moving ID 1 from the WOOF collection, do a loop all the way up to ID 1120 to update
		if(event.address == woof && event.params.tokenId == one) {

			let i = 2;

			for(;i<max.toU32(); i++) {
				const id: BigInt = new BigInt(i);

				let token = fetchERC721Token(contract, id)
				token.save()
			}

		}
	}
}

export function handleApproval(event: ApprovalEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let token    = fetchERC721Token(contract, event.params.tokenId)
		let owner    = fetchAccount(event.params.owner)
		let approved = fetchAccount(event.params.approved)

		token.owner    = owner.id // this should not be necessary, owner changed is signaled by a transfer event
		token.approval = approved.id

		token.save()
		owner.save()
		approved.save()

		// let ev = new Approval(events.id(event))
		// ev.emitter     = contract.id
		// ev.transaction = transactions.log(event).id
		// ev.timestamp   = event.block.timestamp
		// ev.token       = token.id
		// ev.owner       = owner.id
		// ev.approved    = approved.id
		// ev.save()
	}
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
	let contract = fetchERC721(event.address)
	if (contract != null) {
		let owner      = fetchAccount(event.params.owner)
		let operator   = fetchAccount(event.params.operator)
		let delegation = fetchERC721Operator(contract, owner, operator)

		delegation.approved = event.params.approved

		delegation.save()

		// 	let ev = new ApprovalForAll(events.id(event))
		// 	ev.emitter     = contract.id
		// 	ev.transaction = transactions.log(event).id
		// 	ev.timestamp   = event.block.timestamp
		// 	ev.delegation  = delegation.id
		// 	ev.owner       = owner.id
		// 	ev.operator    = operator.id
		// 	ev.approved    = event.params.approved
		// 	ev.save()
	}
}
