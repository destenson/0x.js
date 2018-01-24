import { BlockchainLifecycle, devConstants, RPC, web3Factory } from '@0xproject/dev-utils';
import { BigNumber } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as chai from 'chai';

import * as multiSigWalletJSON from '../../build/contracts/MultiSigWalletWithTimeLock.json';
import * as truffleConf from '../truffle.js';
import { Artifacts } from '../util/artifacts';
import { constants } from '../util/constants';
import { MultiSigWrapper } from '../util/multi_sig_wrapper';
import { ContractInstance } from '../util/types';

import { chaiSetup } from './utils/chai_setup';

const { MultiSigWalletWithTimeLock } = new Artifacts(artifacts);

const MULTI_SIG_ABI = (multiSigWalletJSON as any).abi;
chaiSetup.configure();
const expect = chai.expect;

const web3 = web3Factory.create();
const blockchainLifecycle = new BlockchainLifecycle(devConstants.RPC_URL);

describe('MultiSigWalletWithTimeLock', () => {
    const web3Wrapper = new Web3Wrapper(web3.currentProvider);
    let owners: string[];
    before(async () => {
        const accounts = await web3Wrapper.getAvailableAddressesAsync();
        owners = [accounts[0], accounts[1]];
    });
    const SECONDS_TIME_LOCKED = 10000;

    let multiSig: ContractInstance;
    let multiSigWrapper: MultiSigWrapper;
    let txId: number;
    let initialSecondsTimeLocked: number;
    let rpc: RPC;

    before(async () => {
        multiSig = await MultiSigWalletWithTimeLock.deployed();
        multiSigWrapper = new MultiSigWrapper(multiSig);

        const secondsTimeLocked = await multiSig.secondsTimeLocked.call();
        initialSecondsTimeLocked = secondsTimeLocked.toNumber();
        const rpcUrl = `http://${truffleConf.networks.development.host}:${truffleConf.networks.development.port}`;
        rpc = new RPC(rpcUrl);
    });
    beforeEach(async () => {
        await blockchainLifecycle.startAsync();
    });
    afterEach(async () => {
        await blockchainLifecycle.revertAsync();
    });

    describe('changeTimeLock', () => {
        it('should throw when not called by wallet', async () => {
            return expect(multiSig.changeTimeLock(SECONDS_TIME_LOCKED, { from: owners[0] })).to.be.rejectedWith(
                constants.REVERT,
            );
        });

        it('should throw without enough confirmations', async () => {
            const destination = multiSig.address;
            const from = owners[0];
            const dataParams = {
                name: 'changeTimeLock',
                abi: MULTI_SIG_ABI,
                args: [SECONDS_TIME_LOCKED],
            };
            const subRes = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);

            txId = subRes.logs[0].args.transactionId.toNumber();
            return expect(multiSig.executeTransaction(txId)).to.be.rejectedWith(constants.REVERT);
        });

        it('should set confirmation time with enough confirmations', async () => {
            const res = await multiSig.confirmTransaction(txId, { from: owners[1] });
            expect(res.logs).to.have.length(2);

            const blockNum = await web3Wrapper.getBlockNumberAsync();
            const blockInfo = await web3Wrapper.getBlockAsync(blockNum);
            const timestamp = new BigNumber(blockInfo.timestamp);
            const confirmationTimeBigNum = new BigNumber(await multiSig.confirmationTimes.call(txId));

            expect(timestamp).to.be.bignumber.equal(confirmationTimeBigNum);
        });

        it('should be executable with enough confirmations and secondsTimeLocked of 0', async () => {
            expect(initialSecondsTimeLocked).to.be.equal(0);

            const res = await multiSig.executeTransaction(txId);
            expect(res.logs).to.have.length(2);

            const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.call());
            expect(secondsTimeLocked).to.be.bignumber.equal(SECONDS_TIME_LOCKED);
        });

        const newSecondsTimeLocked = 0;
        it('should throw if it has enough confirmations but is not past the time lock', async () => {
            const destination = multiSig.address;
            const from = owners[0];
            const dataParams = {
                name: 'changeTimeLock',
                abi: MULTI_SIG_ABI,
                args: [newSecondsTimeLocked],
            };
            const subRes = await multiSigWrapper.submitTransactionAsync(destination, from, dataParams);

            txId = subRes.logs[0].args.transactionId.toNumber();
            const confRes = await multiSig.confirmTransaction(txId, {
                from: owners[1],
            });
            expect(confRes.logs).to.have.length(2);

            return expect(multiSig.executeTransaction(txId)).to.be.rejectedWith(constants.REVERT);
        });

        it('should execute if it has enough confirmations and is past the time lock', async () => {
            await rpc.increaseTimeAsync(SECONDS_TIME_LOCKED);
            await multiSig.executeTransaction(txId);

            const secondsTimeLocked = new BigNumber(await multiSig.secondsTimeLocked.call());
            expect(secondsTimeLocked).to.be.bignumber.equal(newSecondsTimeLocked);
        });
    });
});
