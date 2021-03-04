import { TextRobot } from './robots/TextRobot'
import { UserInput } from './utils/UserInput'

class App {

    public async init() {

        const userInputGetter = new UserInput()
        const content = await userInputGetter.get()

        const textRobot = new TextRobot(content)
        await textRobot.run()

        console.log(content)

    }

}

let app: App = new App()
app.init()