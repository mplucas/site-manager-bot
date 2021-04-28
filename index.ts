import { ImageRobot } from './robots/ImageRobot'
import { StateRobot } from './robots/StateRobot'
import { TextRobot } from './robots/TextRobot'
import { VideoRobot } from './robots/VideoRobot'
import { WikipediaRobot } from './robots/WikipediaRobot'
import { YoutubeRobot } from './robots/YoutubeRobot'
import { UserInput } from './utils/UserInput'

class App {

    public async init() {

        try {

            // const userInput = new UserInput()
            // await userInput.get()


            // const wikipediaRobot = new WikipediaRobot()
            // await wikipediaRobot.run()

            // const textRobot = new TextRobot()
            // await textRobot.run()

            // const imageRobot = new ImageRobot()
            // await imageRobot.run()

            // const videoRobot = new VideoRobot()
            // await videoRobot.run()

            const youtubeRobot = new YoutubeRobot()
            await youtubeRobot.run()

            const content = (new StateRobot()).load()
            console.dir(content, { depth: null })

        } catch (error) {

            console.log(error)

        }

    }

}

let app: App = new App()
app.init()