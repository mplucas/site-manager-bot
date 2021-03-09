import { TextRobot } from './robots/TextRobot'
import { WikipediaRobot } from './robots/WikipediaRobot'
import { UserInput } from './utils/UserInput'

class App {

    public async init() {

        const userInput = new UserInput()
        const content = await userInput.get()
        content.maximumSentences = 7

        const wikipediaRobot = new WikipediaRobot(content)
        await wikipediaRobot.run()

        const textRobot = new TextRobot(content)
        await textRobot.run()

        console.log(content)

    }

}

let app: App = new App()
app.init()