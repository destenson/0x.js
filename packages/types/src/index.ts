import {BigNumber} from 'bignumber.js';
import * as Web3 from 'web3';

export enum ZeroExError {
    ExchangeContractDoesNotExist = 'EXCHANGE_CONTRACT_DOES_NOT_EXIST',
    ZRXContractDoesNotExist = 'ZRX_CONTRACT_DOES_NOT_EXIST',
    EtherTokenContractDoesNotExist = 'ETHER_TOKEN_CONTRACT_DOES_NOT_EXIST',
    TokenTransferProxyContractDoesNotExist = 'TOKEN_TRANSFER_PROXY_CONTRACT_DOES_NOT_EXIST',
    TokenRegistryContractDoesNotExist = 'TOKEN_REGISTRY_CONTRACT_DOES_NOT_EXIST',
    TokenContractDoesNotExist = 'TOKEN_CONTRACT_DOES_NOT_EXIST',
    UnhandledError = 'UNHANDLED_ERROR',
    UserHasNoAssociatedAddress = 'USER_HAS_NO_ASSOCIATED_ADDRESSES',
    InvalidSignature = 'INVALID_SIGNATURE',
    ContractNotDeployedOnNetwork = 'CONTRACT_NOT_DEPLOYED_ON_NETWORK',
    InsufficientAllowanceForTransfer = 'INSUFFICIENT_ALLOWANCE_FOR_TRANSFER',
    InsufficientBalanceForTransfer = 'INSUFFICIENT_BALANCE_FOR_TRANSFER',
    InsufficientEthBalanceForDeposit = 'INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT',
    InsufficientWEthBalanceForWithdrawal = 'INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL',
    InvalidJump = 'INVALID_JUMP',
    OutOfGas = 'OUT_OF_GAS',
    NoNetworkId = 'NO_NETWORK_ID',
    SubscriptionNotFound = 'SUBSCRIPTION_NOT_FOUND',
    SubscriptionAlreadyPresent = 'SUBSCRIPTION_ALREADY_PRESENT',
    TransactionMiningTimeout = 'TRANSACTION_MINING_TIMEOUT',
}

export type ArtifactContractName = 'ZRX'|'TokenTransferProxy'|'TokenRegistry'|'Token'|'Exchange'|'EtherToken';

export interface Artifact {
    contract_name: ArtifactContractName;
    abi: Web3.ContractAbi;
    networks: {
        [networkId: number]: {
            address: string;
        };
    };
}

export interface TxData {
    from?: string;
    gas?: number;
    gasPrice?: BigNumber;
    nonce?: number;
}

export interface TransactionReceipt {
    blockHash: string;
    blockNumber: number;
    transactionHash: string;
    transactionIndex: number;
    from: string;
    to: string;
    status: null|0|1;
    cumulativeGasUsed: number;
    gasUsed: number;
    contractAddress: string|null;
    logs: Web3.LogEntry[];
}
