import readline from 'readline'

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

class App {

    public async init() {

        let content: any = {}

        content.searchTerm = await this.askAndReturnSearchTerm()
        content.prefix = await this.askAndReturnPrefix();

        console.log(content)

        rl.close()
    }

    private async askAndReturnSearchTerm() {

        console.log('Type a Wikipedia search term: ')

        const it = rl[Symbol.asyncIterator]()
        let searchTerm: string = (await it.next()).value

        return searchTerm

    }

    private async askAndReturnPrefix() {

        const prefixes = ['Who is', 'What is', 'The history of']

        console.log('\nSelect one of:')

        prefixes.map((prefix, index) => {

            console.log(`[${index}] - ${prefix}`)

        })

        const it = rl[Symbol.asyncIterator]()
        const selectedPrefixIndex = parseInt((await it.next()).value)

        let selectedPrefixText: string = prefixes[selectedPrefixIndex]

        return selectedPrefixText

    }

}

let app: App = new App()
app.init()