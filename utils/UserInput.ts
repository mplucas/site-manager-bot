import readline from 'readline'
import { Content } from '../interfaces'

export class UserInput {

    private rl: readline.Interface

    public async get() {

        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        let content: Content = {} as Content

        content.searchTerm = await this.askAndReturnSearchTerm()
        content.prefix = await this.askAndReturnPrefix()

        this.rl.close()

        return content
    }

    private async askAndReturnSearchTerm() {

        console.log('Type a Wikipedia search term: ')

        const it = this.rl[Symbol.asyncIterator]()
        let searchTerm: string = (await it.next()).value

        return searchTerm

    }

    private async askAndReturnPrefix() {

        const prefixes = ['Who is', 'What is', 'The history of']

        console.log('\nSelect one of:')

        prefixes.map((prefix, index) => {

            console.log(`[${index}] - ${prefix}`)

        })

        const it = this.rl[Symbol.asyncIterator]()
        const selectedPrefixIndex = parseInt((await it.next()).value)

        let selectedPrefixText: string = prefixes[selectedPrefixIndex]

        return selectedPrefixText

    }

}