import { parentPort, workerData } from 'worker_threads';
import { ethers } from 'ethers';

if (!parentPort) {
    throw new Error('This file must be run as a worker thread');
}

const privateKey = workerData.privateKey;
const wallet = new ethers.Wallet(privateKey);

parentPort.on('message', async (message) => {
    const { id, type, payload } = message;

    try {
        let signature;

        if (type === 'signTypeData') {
            const { domain, types, value } = payload;
            signature = await wallet.signTypedData(domain, types, value);
        } else if (type === 'signMessage') {
            signature = await wallet.signMessage(payload);
        } else {
            throw new Error(`Unknown sign type: ${type}`);
        }

        parentPort.postMessage({ id, success: true, signature });
    } catch (error) {
        parentPort.postMessage({ id, success: false, error: error.message });
    }
});
