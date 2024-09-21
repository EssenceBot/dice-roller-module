declare var self: Worker;
import { checkNumberOfRerolls, calculateRoll } from "./lib";

self.onmessage = (event: MessageEvent<{ rollInput: string, sort: boolean }>) => {
  const rerollsResult = checkNumberOfRerolls(event.data.rollInput)
    if (rerollsResult.status === 'error' || typeof rerollsResult.result === 'string') {
        postMessage({ status: 'error', result: rerollsResult.result as string})
    }
    rerollsResult.result = rerollsResult.result as { numberOfRerolls: number; output: string; }
    const calculatedRoll = calculateRoll(rerollsResult.result.numberOfRerolls, rerollsResult.result.output, event.data.sort)

    if (calculatedRoll.status === 'error' || typeof calculatedRoll.result === 'string') {
        postMessage({ status: 'error', result: calculatedRoll.result as string})
    }
    calculatedRoll.result = calculatedRoll.result as { sum: number[]; fancyOutput: string[]; }
    postMessage({ status: 'success', result: { sum: calculatedRoll.result.sum, output: calculatedRoll.result.fancyOutput } })
    process.exit(0)
};