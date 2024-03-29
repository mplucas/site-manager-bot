import { Content } from "../interfaces";
import { StateRobot } from "./StateRobot";

const videoshow = require('videoshow');
const gm = require('gm').subClass({ imageMagick: true })

import path from 'path';
const audio = path.join(__dirname, '../templates/1/newsroom.mp3');
const video = path.join(__dirname, '../content/video-maker.mp4');

export class VideoRobot {

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

        console.log(`> [video-robot] Starting...`)

        await this.convertAllImages()
        await this.createAllSentenceImages()
        await this.createYouTubeThumbnail()
        await this.createFFmpegScript()
        await this.renderVideoWithFFmpegAndNode()

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

    private async createFFmpegScript() {
        this.stateRobot.saveScript(this.content)
    }

    private async renderVideoWithFFmpegAndNode() {

        console.log('> [video-robot] Rendering video with FFmpeg...');

        return new Promise<void>((resolve, reject) => {
            let images = [];

            for (let sentenceIndex = 0; sentenceIndex < this.content.sentences.length; sentenceIndex++) {
                images.push({
                    path: `./content/${sentenceIndex}-converted.png`,
                    caption: this.content.sentences[sentenceIndex].text,
                });
            }

            const audioParams = {
                fade: true,
                delay: 1, // seconds
            };

            const videoOptions = {
                fps: 30,
                loop: 10, // seconds
                transition: true,
                transitionDuration: 1, // seconds
                videoBitrate: 1024,
                videoCodec: 'libx264',
                size: '640x?',
                audioBitrate: '128k',
                audioChannels: 2,
                format: 'mp4',
                pixelFormat: 'yuv420p',
                useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
                subtitleStyle: {
                    Fontname: 'Verdana',
                    Fontsize: '30',
                    PrimaryColour: '11861244',
                    SecondaryColour: '11861244',
                    TertiaryColour: '11861244',
                    BackColour: '-2147483640',
                    Bold: '2',
                    Italic: '0',
                    BorderStyle: '2',
                    Outline: '2',
                    Shadow: '3',
                    Alignment: '1', // left, middle, right
                    MarginL: '40',
                    MarginR: '60',
                    MarginV: '40',
                },
            };

            videoshow(images, videoOptions)
                .audio(audio, audioParams) // adding audio
                .save(video)
                .on('start', function (command) {
                    console.log(
                        '\n\n [ FFmpeg still working in ]:\n\n',
                        command,
                        '\n\n[ Please wait... ]',
                    );
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err);
                    console.error('ffmpeg stderr: ', stderr);
                })
                .on('end', function (output) {
                    resolve();
                    console.error(
                        '\n\n[video-robot] Finished processing. Video created:\n\n',
                        output,
                        '\n\n',
                    );
                });
        });
    }

}