import { Content } from "../interfaces";
import { StateRobot } from "./StateRobot";


const gm = require('gm').subClass({ imageMagick: true })

export class VideoRobot{

    private stateRobot = new StateRobot()

    private content: Content;

    constructor(content?: Content) {

        if (content) {
            this.content = content
        } else {
            this.content = this.stateRobot.load()
        }

    }

    public async run(){

        await this.convertAllImages()
        await this.createAllSentenceImages()
        await this.createYouTubeThumbnail()
        await this.createAfterEffectsScript()

    }

    private async convertAllImages() {
        for (let i = 0; i < this.content.sentences.length; i++) {
            await this.convertImage(i)
        }
    }

    private async convertImage(sentenceIndex) {
        return new Promise<void>((resolve, reject) => {
            const inputFile = `./content/${sentenceIndex}-original.png[0]`
            const outputFile = `./content/${sentenceIndex}-converted.png`
            const width = 1920
            const height = 1080

            gm()
                .in(inputFile)
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-blur', '0x9')
                .out('-resize', `${width}x${height}^`)
                .out(')')
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-resize', `${width}x${height}`)
                .out(')')
                .out('-delete', '0')
                .out('-gravity', 'center')
                .out('-compose', 'over')
                .out('-composite')
                .out('-extent', `${width}x${height}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log(`> [video-robot] Image converted: ${outputFile}`)
                    resolve()
                })

        })
    }

    private async createAllSentenceImages() {
        for (let i = 0; i < this.content.sentences.length; i++) {
            await this.createSentenceImage(i, this.content.sentences[i].text)
        }
    }

    private async createSentenceImage(sentenceIndex, sentenceText) {
        return new Promise<void>((resolve, reject) => {
            const outputFile = `./content/${sentenceIndex}-sentence.png`

            const templateSettings = {
                0: {
                    size: '1920x400',
                    gravity: 'center'
                },
                1: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                2: {
                    size: '800x1080',
                    gravity: 'west'
                },
                3: {
                    size: '1920x400',
                    gravity: 'center'
                },
                4: {
                    size: '1920x1080',
                    gravity: 'center'
                },
                5: {
                    size: '800x1080',
                    gravity: 'west'
                },
                6: {
                    size: '1920x400',
                    gravity: 'center'
                }

            }

            gm()
                .out('-size', templateSettings[sentenceIndex].size)
                .out('-gravity', templateSettings[sentenceIndex].gravity)
                .out('-background', 'transparent')
                .out('-fill', 'white')
                .out('-kerning', '-1')
                .out(`caption:${sentenceText}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log(`> [video-robot] Sentence created: ${outputFile}`)
                    resolve()
                })
        })
    }

    private async createYouTubeThumbnail() {
        return new Promise<void>((resolve, reject) => {
            gm()
                .in(`./content/0-converted.png`)
                .write('./content/youtube-thumbnail.jpg', (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log('> [video-robot] YouTube thumbnail created')
                    resolve()
                })
        })
    }

    private async createAfterEffectsScript(){
        this.stateRobot.saveScript(this.content)
    }

}