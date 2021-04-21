import { Content, Sentence } from "../interfaces";
import { StateRobot } from "./StateRobot";
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
import imageDownloader from 'image-downloader';
import path from 'path';
const rootPath = path.resolve(__dirname, '..')
const fromRoot = (relPath: string) => path.resolve(rootPath, relPath)
const gm = require('gm').subClass({ imageMagick: true })

import { api as googleSearchAPI } from "../credentials/google-search"

export class ImageRobot {

    private stateRobot = new StateRobot()

    private content: Content;

    constructor(content?: Content) {

        if (content) {
            this.content = content
        } else {
            this.content = this.stateRobot.load()
        }

    }

    public async run() {

        for (let i = 0; i < this.content.sentences.length; i++) {

            const sentence = this.content.sentences[i];
            const query = `${this.content.searchTerm} ${sentence.keywords[0]}`
            sentence.images = await this.fetchGoogleAndReturnImageLinks(query)
            sentence.googleSearchQuery = query

        }

        this.stateRobot.save(this.content)

        await this.downloadAllImages()

        if (this.successfulDownloadedImageIndexes.length == 0) {
            throw new Error('No images downloaded')
        }

        await this.convertAllImages()
        await this.createAllSentenceImages()
        await this.createYouTubeThumbnail()

    }

    private async fetchGoogleAndReturnImageLinks(query: string) {

        const response = await customSearch.cse.list({
            auth: googleSearchAPI.apiKey,
            cx: googleSearchAPI.searchEngineId,
            q: query,
            searchType: 'image',
            num: 2
        })

        if (response.data.items) {

            const imagesURL = response.data.items.map(item => {
                return item.link
            })

            return imagesURL
        }

        return []

    }

    private successfulDownloadedImageIndexes: number[] = []
    private async downloadAllImages() {

        for (let i = 0; i < this.content.sentences.length; i++) {

            const images = this.content.sentences[i].images

            for (let j = 0; j < images.length; j++) {

                const imageURL = images[j]

                try {

                    await this.downloadAndSaveImage(imageURL, `${i}-original.png`)
                    console.log(`> ${i} ${j} Image downloaded.`)
                    this.successfulDownloadedImageIndexes.push(i)
                    break

                } catch {
                    console.log(`> ${i} ${j} Error in image download.`)
                }

            }

        }

    }

    private downloadedURLs: string[] = []
    private async downloadAndSaveImage(url: string, fileName: string) {

        if (this.downloadedURLs.includes(url)) {
            throw new Error('Image already downloaded.')
        }

        await imageDownloader.image({
            url: url,
            dest: `./content/${fileName}`
        })

        this.downloadedURLs.push(url)

    }

    private async convertAllImages() {
        for (let i of this.successfulDownloadedImageIndexes) {
            await this.convertImage(i)
        }
    }

    private async convertImage(sentenceIndex) {
        return new Promise<void>((resolve, reject) => {
            const inputFile = fromRoot(`./content/${sentenceIndex}-original.png[0]`)
            const outputFile = fromRoot(`./content/${sentenceIndex}-converted.png`)
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
        for (let i of this.successfulDownloadedImageIndexes) {
            await this.createSentenceImage(i, this.content.sentences[i].text)
        }
    }

    private async createSentenceImage(sentenceIndex, sentenceText) {
        return new Promise<void>((resolve, reject) => {
            const outputFile = fromRoot(`./content/${sentenceIndex}-sentence.png`)

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
                .in(fromRoot(`./content/${this.successfulDownloadedImageIndexes[0]}-converted.png`))
                .write(fromRoot('./content/youtube-thumbnail.jpg'), (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log('> [video-robot] YouTube thumbnail created')
                    resolve()
                })
        })
    }

}