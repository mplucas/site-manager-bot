import { ImageRobot } from './robots/ImageRobot'
import { StateRobot } from './robots/StateRobot'
import { TextRobot } from './robots/TextRobot'
import { WikipediaRobot } from './robots/WikipediaRobot'
import { UserInput } from './utils/UserInput'

class App {

    public async init() {

        try {

            const userInput = new UserInput()
            await userInput.get()

            const wikipediaRobot = new WikipediaRobot()
            await wikipediaRobot.run()

            const textRobot = new TextRobot()
            await textRobot.run()

            const imageRobot = new ImageRobot()
            await imageRobot.run()

            const content = (new StateRobot()).load()
            console.dir(content, { depth: null })

        } catch (error) {

            console.log(error)

        }

    }

}

let app: App = new App()
app.init()