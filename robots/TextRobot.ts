import { Content } from "../interfaces";
import { api } from "../credentials/algorithmia";
import algorithmia from "algorithmia";
import sentenceBoundaryDetection from "sbd";

export class TextRobot {

    private content: Content

    constructor(content: Content) {

        this.content = content

    }

    public async run() {

        await this.fetchContentFromWikipedia()
        this.sanitizeContent()
        this.breakContentIntoSentences()

    }

    private async fetchContentFromWikipedia() {

        const algorithimiaAuthenticate = algorithmia(api.key)
        const wikipediaAlgorithim = algorithimiaAuthenticate.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithim.pipe(this.content.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        this.content.sourceContentOriginal = wikipediaContent.content

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
                images: []
            })
        })

    }

}