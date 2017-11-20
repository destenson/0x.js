import * as _ from 'lodash';
import * as timers from 'timers';
import * as Web3 from 'web3';
// HACK: web3 leaks XMLHttpRequest into the global scope and causes requests to hang
// because they are using the wrong XHR package.
// Issue: https://github.com/trufflesuite/truffle-contract/issues/14
delete (global as any).XMLHttpRequest;

const MAX_QUEUE_SIZE = 500;
const DEFAULT_QUEUE_INTERVAL_MS = 1000;

export class RequestQueue {
    protected queueIntervalMs: number;
    protected queue: string[];
    protected queueIntervalId: NodeJS.Timer;
    protected web3: Web3;
    constructor(web3: any) {
        this.queueIntervalMs = DEFAULT_QUEUE_INTERVAL_MS;
        this.queue = [];

        this.web3 = web3;

        this.start();
    }
    public add(recipientAddress: string): boolean {
        if (this.isFull()) {
            return false;
        }
        this.queue.push(recipientAddress);
        return true;
    }
    public size(): number {
        return this.queue.length;
    }
    public isFull(): boolean {
        return this.size() >= MAX_QUEUE_SIZE;
    }
    protected start() {
        this.queueIntervalId = timers.setInterval(() => {
            if (this.queue.length === 0) {
                return;
            }
            const recipientAddress = this.queue.shift();
            this.processNextRequestFireAndForgetAsync(recipientAddress);
        }, this.queueIntervalMs);
    }
    protected stop() {
        clearInterval(this.queueIntervalId);
    }
    protected async processNextRequestFireAndForgetAsync(recipientAddress: string) {
        throw new Error('Expected processNextRequestFireAndForgetAsync to be implemented by a superclass');
    }
}
