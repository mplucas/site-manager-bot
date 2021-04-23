import { Content } from "../interfaces"
import fs from 'fs'

export class StateRobot {

    private contentFilePath = './content.json'
    private scriptFilePath = './content/after-effects-script.js'

    public save(content: Content) {
        const contentString = JSON.stringify(content)
        return fs.writeFileSync(this.contentFilePath, contentString)
    }

    public load() {
        const fileBuffer = fs.readFileSync(this.contentFilePath, 'utf-8')
        const contenJson = JSON.parse(fileBuffer) as Content
        return contenJson
    }

    public saveScript(content:Content){
        const contentString = JSON.stringify(content)
        const scriptString = `var content = ${contentString}`
        return fs.writeFileSync(this.scriptFilePath, scriptString)
    }

}