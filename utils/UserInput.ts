import readline from 'readline'
import { Content } from '../interfaces'
import { chooseOneIn } from './Functions'

export class UserInput {

    public async get() {

        let content: Content = {} as Content

        content.searchTerm = await this.askAndReturnSearchTerm()
        content.prefix = await this.askAndReturnPrefix()

        return content
    }

    private async askAndReturnSearchTerm() {

        let rl: readline.Interface = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        })

        console.log('Informe um termo de pesquisa na Wikipédia: ')

        const it = rl[Symbol.asyncIterator]()
        let searchTerm: string = (await it.next()).value

        rl.close()

        return searchTerm

    }

    private async askAndReturnPrefix() {

        const prefixes = ['Quem é', 'O que é', 'A história de']

        const selectedIndex = await chooseOneIn(prefixes)

        return prefixes[selectedIndex]

    }

}