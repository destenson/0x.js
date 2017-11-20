import * as _ from 'lodash';
import {ZeroEx} from '0x.js';
import BigNumber from 'bignumber.js';
import promisify = require('es6-promisify');
import {utils} from './utils';
import {configs} from './configs';
import {RequestQueue} from './request_queue';
import {errorReporter} from './error_reporter';
import * as Web3 from 'web3';
// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Issue: https://github.com/trufflesuite/truffle-contract/issues/14
delete (global as any).XMLHttpRequest;

const DISPENSE_AMOUNT_ZRX = new BigNumber(0.1);
const QUEUE_INTERVAL_MS = 5000;

export class ZRXRequestQueue extends RequestQueue {
    private zeroEx: ZeroEx;
    constructor(web3: Web3) {
        super(web3);
        this.queueIntervalMs = QUEUE_INTERVAL_MS;
        this.zeroEx = new ZeroEx(web3.currentProvider);
    }
    protected async processNextRequestFireAndForgetAsync(recipientAddress: string) {
        utils.consoleLog(`Processing ZRX ${recipientAddress}`);
        const baseUnitAmount = ZeroEx.toBaseUnitAmount(DISPENSE_AMOUNT_ZRX, 18);
        try {
            await this.zeroEx.token.transferAsync(
                configs.ZRX_TOKEN_ADDRESS, configs.DISPENSER_ADDRESS, recipientAddress, baseUnitAmount,
            );
            utils.consoleLog(`Sent ${DISPENSE_AMOUNT_ZRX} ZRX to ${recipientAddress}`);
        } catch (err) {
            utils.consoleLog(`Unexpected err: ${err} - ${JSON.stringify(err)}`);
            await errorReporter.reportAsync(err);
        }
    }
}
