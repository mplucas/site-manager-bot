import { Content } from "../interfaces";
import { StateRobot } from "./StateRobot";
import imageDownloader from 'image-downloader';

const google = require('googleapis').google
const customSearch = google.customsearch('v1')

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

        console.log(`> [image-robot] Starting...`)

        await this.fetchImagesOfAllSentences()

        if (this.content.sentences.length == 0) {
            throw new Error('No images fetched')
        }

        await this.downloadAllImages()

        if (this.successfulDownloadedImageIndexes.length == 0) {
            throw new Error('No images downloaded')
        }

    }

    private async fetchImagesOfAllSentences() {

        for (let i = 0; i < this.content.sentences.length; i++) {

            const sentence = this.content.sentences[i];
            const query = i == 0 ? `${this.content.searchTerm}` : `${this.content.searchTerm} ${sentence.keywords[0]}`
            console.log(`> [image-robot] Querying Google images with "${query}"`)
            sentence.images = await this.fetchGoogleAndReturnImageLinks(query)
            sentence.googleSearchQuery = query

        }

        this.stateRobot.save(this.content)

    }

    private async fetchGoogleAndReturnImageLinks(query: string) {

        const response = await customSearch.cse.list({
            auth: googleSearchAPI.apiKey,
            cx: googleSearchAPI.searchEngineId,
            q: query,
            searchType: 'image',
            num: 5
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
                    console.log(`> [image-robot] ${i} ${j} Image downloaded.`)
                    this.successfulDownloadedImageIndexes.push(i)
                    break

                } catch {
                    console.log(`> [image-robot] ${i} ${j} Error in image download.`)
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

}