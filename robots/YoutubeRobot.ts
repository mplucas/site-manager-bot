import { Content } from "../interfaces"
import { StateRobot } from "./StateRobot"
import express from "express"
import { google } from "googleapis"
import fs from 'fs'

const OAuth2 = google.auth.OAuth2
const youtube = google.youtube({ version: 'v3' })

import { api as youtubeAPI } from "../credentials/youtube"

export class YoutubeRobot {

    private stateRobot = new StateRobot()

    private content: Content

    constructor(content?: Content) {

        if (content) {
            this.content = content
        } else {
            this.content = this.stateRobot.load()
        }

    }

    public async run() {

        console.log(`> [youtube-robot] Starting...`)

        await this.authenticateWithOAuth()
        const videoInformation = await this.uploadVideo()
        await this.uploadThumbnail(videoInformation)

    }

    private async authenticateWithOAuth() {

        const webServer = await this.startWebServer()
        const OAuthClient = await this.createOAuthClient()
        this.requestUserConsent(OAuthClient)
        const authorizationToken = await this.waitForGoogleCallback(webServer)
        await this.requestGoogleForAccessTokens(OAuthClient, authorizationToken)
        this.setGlobalGoogleAuthentication(OAuthClient)
        await this.stopWebServer(webServer)

    }

    private async startWebServer() {
        return new Promise((resolve, reject) => {
            const port = 5000
            const app = express()

            const server = app.listen(port, () => {
                console.log(`> [youtube-robot] Listening on http://localhost:${port}`)
                resolve({
                    app,
                    server
                })
            })
        })
    }

    private async createOAuthClient() {
        const credentials = youtubeAPI
        const OAuthClient = new OAuth2(
            credentials.web.client_id,
            credentials.web.client_secret,
            credentials.web.redirect_uris[0]
        )
        return OAuthClient
    }

    private requestUserConsent(OAuthClient) {
        const consentUrl = OAuthClient.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/youtube']
        })
        console.log(`> [youtube-robot] Please give your consent: ${consentUrl}`)
    }

    private async waitForGoogleCallback(webServer) {
        return new Promise((resolve, reject) => {
            console.log('> [youtube-robot] Waiting for user content...')
            webServer.app.get('/oauth2callback', (req, res) => {
                const authCode = req.query.code
                console.log(`> [youtube-robot] Consent given: ${authCode}`)
                res.send("<h1>Thank you!</h1><p>Now close this tab</p>")
                resolve(authCode)
            })
        })
    }

    private requestGoogleForAccessTokens(OAuthClient, authorizationToken) {

        return new Promise<void>((resolve, reject) => {
            OAuthClient.getToken(authorizationToken, (error, tokens) => {
                if (error) {
                    return reject(error)
                }
                console.log('> [youtube-robot] Access tokens received:')
                console.log(tokens)
                OAuthClient.setCredentials(tokens)
                resolve()
            })
        })

    }

    private setGlobalGoogleAuthentication(OAuthClient) {
        google.options({
            auth: OAuthClient
        })
    }

    private async stopWebServer(webServer) {
        return new Promise<void>((resolve, reject) => {
            webServer.server.close(() => {
                resolve()
            })
        })
    }

    private async uploadVideo() {

        const videoFilePath = './content/video-maker.mp4'
        const videoFileSize = fs.statSync(videoFilePath).size
        const videoTitle = `${this.content.prefix} ${this.content.searchTerm}`
        const videoTags = [this.content.searchTerm, ...this.content.sentences[0].keywords]
        const videoDescription = this.content.sentences.map((sentence) => {
            return sentence.text
        }).join('\n\n')

        const requestParameters = {
            part: ['snippet', 'status'],
            requestBody: {
                snippet: {
                    title: videoTitle,
                    description: videoDescription,
                    tags: videoTags
                },
                status: {
                    privacyStatus: 'unlisted'
                }
            },
            media: {
                body: fs.createReadStream(videoFilePath)
            }
        }

        console.log('> [youtube-robot] Starting to upload videos to Youtube')
        const youtubeResponse = await youtube.videos.insert(requestParameters, {
            onUploadProgress: (event) => {
                const progress = Math.round((event.bytesRead / videoFileSize) * 100)
                console.log(`> [youtube-robot] ${progress}% completed`)
            }
        })

        console.log(`> [youtube-robot] Video available at: https://youtu.be/${youtubeResponse.data.id}`)
        return youtubeResponse.data

    }

    private async uploadThumbnail(videoInformation) {

        const videoId = videoInformation.id
        const videoThumbnailFilePath = './content/youtube-thumbnail.jpg'

        const requestParameters = {
            videoId: videoId,
            media: {
                mimetype: 'image/jpeg',
                body: fs.createReadStream(videoThumbnailFilePath)
            }
        }

        await youtube.thumbnails.set(requestParameters)
        console.log('> [youtube-robot] Thumbnail uploaded!')

    }
}