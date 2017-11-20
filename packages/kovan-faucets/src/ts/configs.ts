export const configs = {
    DISPENSER_ADDRESS: process.env.DISPENSER_ADDRESS.toLowerCase(),
    DISPENSER_PRIVATE_KEY: process.env.DISPENSER_PRIVATE_KEY,
    ENVIRONMENT: process.env.FAUCET_ENVIRONMENT,
    ROLLBAR_ACCESS_KEY: process.env.FAUCET_ROLLBAR_ACCESS_KEY,
    RPC_URL: process.env.FAUCET_ENVIRONMENT === 'development' ?
        'http://127.0.0.1:8545' :
        'https://kovan.infura.io/T5WSC8cautR4KXyYgsRs',
    ZRX_TOKEN_ADDRESS: '0x6ff6c0ff1d68b964901f986d4c9fa3ac68346570',
};
