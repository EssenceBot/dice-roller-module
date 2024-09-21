import { evaluate } from 'mathjs'

export function rollDice(rolls: number, sides: number, sort: boolean = false): number[] {
    let result: number[] = []
    for (let i = 0; i < rolls; i++) {
        result.push(Math.floor(Math.random() * sides) + 1)
    }
    return sort ? result.sort(function(a, b){return a-b}).reverse() : result
}

export function checkNumberOfRerolls(input: string) {
    const hashMatches = input.match(/#/g) || [];

    if (hashMatches.length === 0) {
        return { status: 'success', result: { numberOfRerolls: 1, output: input } }
    }
    const numberMatches = input.match(/\d+/g) || [];

    if (hashMatches.length > 1) {
        return { status: 'error', result: 'Too many # in the input' }
    }

    if (numberMatches.length !== 0 && numberMatches[0] !== undefined ) {
        const output = input.replace(`${numberMatches[0]}#`, '')

        return { status: 'success', result: { numberOfRerolls: +numberMatches[0], output: output } }
    }

    return { status: 'error', result: '# is present but no number of rerolls is specified' }
}

export function calculateRoll(numberOfRerolls: number, input: string, sort: boolean) {
    const diceRegex = /((100)|[0-9]{1,2})d((1000)|[0-9]{1,3})/gi;

    let fancyOutputArray: string[] = []
    let sumArray: number[] = []
    for (let i = 0; i < numberOfRerolls; i++) {
        const diceRolls = input.match(diceRegex)
        if (diceRolls === null) {
            return { status: 'error', result: "No dice rolls found in the input" }
        }
        let diceRollsResult: Array<number[]> = []
        let splitDiceRolls: Array<number[]> = []
        diceRolls.forEach(diceRoll => {
            const splitDiceRoll = diceRoll.split('d')
            splitDiceRolls.push([+splitDiceRoll[0], +splitDiceRoll[1]])
            const result = rollDice(+splitDiceRoll[0], +splitDiceRoll[1], sort)
            diceRollsResult.push(result)
        })
        let fancyOutput = input.replace(/(\+|\-|\/|\*)/g, ' $1 ');
        let toCalculateOutput = input
        diceRollsResult.forEach((result, index) => {
            const highestRegex = new RegExp(`(?<!\\d)${splitDiceRolls[index][1]}(?!\\d)`, 'g');
            fancyOutput = fancyOutput.replace(
                diceRolls[index],
                `[${result.join(', ')}]`
                .replace(/(?<!\d)1(?!\d)/g, '**1**')
                .replace(highestRegex, `**${splitDiceRolls[index][1]}**`)
            );

            toCalculateOutput = toCalculateOutput.replace(diceRolls[index], `[${result.reduce((a, b) => a + b, 0)}]`);
        })
        fancyOutputArray.push(fancyOutput)
        try {
            const mathResult = evaluate(toCalculateOutput)
            sumArray.push(mathResult._data[0])
        } catch (error) {
            return { status: 'error', result: "There was an error while calculating the result"}
        }
        
    }
    return { status: 'success', result: { sum: sumArray, fancyOutput: fancyOutputArray } }
}
