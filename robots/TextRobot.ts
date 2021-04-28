import { Content } from "../interfaces";
import { api as algorithmiaAPI } from "../credentials/algorithmia";
import { api as watsonAPI } from "../credentials/watson-nlu";
import algorithmia from "algorithmia";
import sentenceBoundaryDetection from "sbd";
import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1.js';
import { IamAuthenticator } from 'ibm-watson/auth'
import { StateRobot } from "./StateRobot";

export class TextRobot {

    private nlu: NaturalLanguageUnderstandingV1
    private content: Content
    private stateRobot = new StateRobot()

    constructor(content?: Content) {

        if (content) {
            this.content = content
        } else {
            this.content = this.stateRobot.load()
        }

        this.nlu = new NaturalLanguageUnderstandingV1({
            authenticator: new IamAuthenticator({
                apikey: watsonAPI.apikey,
            }),
            version: '2018-04-05',
            url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
        })

    }

    public async run() {

        console.log('> [text-robot] Starting...')
        if (!this.content.sourceContentOriginal) {
            await this.fetchContentFromWikipedia()
        } else {
            console.log('> [text-robot] Not fetching from wikipedia beacuse Wiipedia robot already fetched...')
        }

        this.sanitizeContent()
        this.breakContentIntoSentences()
        this.limitMaximumSentences()
        await this.fetchKeywordsOfAllSentences()

        this.stateRobot.save(this.content)
    }

    private async fetchContentFromWikipedia() {

        console.log('> [text-robot] Fetching from Wikipedia...')

        const algorithimiaAuthenticate = algorithmia(algorithmiaAPI.key)
        const wikipediaAlgorithim = algorithimiaAuthenticate.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithim.pipe({ articleName: this.content.searchTerm })
        const wikipediaContent = wikipediaResponse.get()

        this.content.sourceContentOriginal = wikipediaContent.content

        console.log('> [text-robot] Fetching done!...')

    }

    private sanitizeContent() {

        const withoutBlankLinesAndMarkdown = this.removeBlankLinesAndMarkdown(this.content.sourceContentOriginal)
        const withoutDatesInParenthesis = this.removeDatesInParenthesis(withoutBlankLinesAndMarkdown)

        this.content.sourceContentSanitized = withoutDatesInParenthesis

    }

    private removeBlankLinesAndMarkdown(text: string) {

        const allLines = text.split('\n')

        const withoutBlankLinesAndMarkdown = allLines.filter(line => {
            return line.trim().length !== 0 && !line.trim().startsWith('=')
        })

        return withoutBlankLinesAndMarkdown.join(' ')

    }

    private removeDatesInParenthesis(text: string) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
    }

    private breakContentIntoSentences() {

        this.content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(this.content.sourceContentSanitized)

        sentences.map(sentence => {
            this.content.sentences.push({
                text: sentence,
                keywords: [],
                images: [],
                googleSearchQuery: ''
            })
        })

    }

    private limitMaximumSentences() {
        this.content.sentences = this.content.sentences.splice(0, this.content.maximumSentences)
    }

    private async fetchKeywordsOfAllSentences() {

        console.log('> [text-robot] Starting to fetch keywords from Watson')

        for (const sentence of this.content.sentences) {
            console.log(`> [text-robot] Sentence: "${sentence.text}"`)
            sentence.keywords = await this.fetchWatsonAndReturnKeywords(sentence.text)
            console.log(`> [text-robot] Keywords: "${sentence.keywords.join(', ')}"`)
        }

    }

    private async fetchWatsonAndReturnKeywords(sentence: string): Promise<string[]> {

        return new Promise(resolve => {

            this.nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }).then(response => {

                const keywords = response.result.keywords.map(keyword => {
                    return keyword.text
                })

                resolve(keywords)

            }).catch(error => {
                return error
            })

        })

    }

}