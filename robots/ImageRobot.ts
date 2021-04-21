import { Content, Sentence } from "../interfaces";
import { StateRobot } from "./StateRobot";
const google = require('googleapis').google
const customSearch = google.customsearch('v1')
import imageDownloader from 'image-downloader';

import { api } from "../credentials/google-search"

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

    }

    private async fetchGoogleAndReturnImageLinks(query: string) {

        const response = await customSearch.cse.list({
            auth: api.apiKey,
            cx: api.searchEngineId,
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

    private async downloadAllImages() {

        for (let i = 0; i < this.content.sentences.length; i++) {

            const images = this.content.sentences[i].images

            for (let j = 0; j < images.length; j++) {

                const imageURL = images[j]

                try {

                    await this.downloadAndSaveImage(imageURL, `${i}-original.png`)
                    console.log(`> ${i} ${j} Image downloaded.`)

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

}