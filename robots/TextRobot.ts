import { Content } from "../interfaces";
import { api as algorithmiaAPI } from "../credentials/algorithmia";
import { api as watsonAPI } from "../credentials/watson-nlu";
import algorithmia from "algorithmia";
import sentenceBoundaryDetection from "sbd";
import NaturalLanguageUnderstandingV1 from 'ibm-watson/natural-language-understanding/v1.js';
import { IamAuthenticator } from 'ibm-watson/auth'

export class TextRobot {

    private nlu: NaturalLanguageUnderstandingV1;
    private content: Content

    constructor(content: Content) {

        this.content = content
        this.nlu = new NaturalLanguageUnderstandingV1({
            authenticator: new IamAuthenticator({
                apikey: watsonAPI.apikey,
            }),
            version: '2018-04-05',
            url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
        })

    }

    public async run() {

        const simulate = true;

        if (simulate) {
            this.simulateAlgorithmiaCallBeacon()
        } else {
            await this.fetchContentFromWikipedia()
        }

        this.sanitizeContent()
        this.breakContentIntoSentences()
        this.limitMaximumSentences()
        await this.fetchKeywordsOfAllSentences()

    }

    private async fetchContentFromWikipedia() {

        const algorithimiaAuthenticate = algorithmia(algorithmiaAPI.key)
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

    private limitMaximumSentences() {
        this.content.sentences = this.content.sentences.splice(0, this.content.maximumSentences)
    }

    private async fetchKeywordsOfAllSentences() {

        for (const sentence of this.content.sentences) {
            sentence.keywords = await this.fetchWatsonAndReturnKeywords(sentence.text)
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

    private simulateAlgorithmiaCallBeacon() {

        this.content.searchTerm = 'bacon'
        this.content.prefix = 'The history of'
        this.content.sourceContentOriginal = 'A beacon is an intentionally conspicuous device designed to attract attention to a specific location. A common example is the lighthouse, which provides a fixed location that can be used to navigate around obstacles or into port. More modern examples include a variety of radio beacons that can be read on radio direction finders in all weather, and radar transponders that appear on radar displays.\n' +
            'Beacons can also be combined with semaphoric or other indicators to provide important information, such as the status of an airport, by the colour and rotational pattern of its airport beacon, or of pending weather as indicated on a weather beacon mounted at the top of a tall building or similar site. When used in such fashion, beacons can be considered a form of optical telegraphy.\n' +
            '\n' +
            '\n' +
            '== For navigation ==\n' +
            '\n' +
            'Beacons help guide navigators to their destinations. Types of navigational beacons include radar reflectors, radio beacons, sonic and visual signals. Visual beacons range from small, single-pile structures to large lighthouses or light stations and can be located on land or on water. Lighted beacons are called lights; unlighted beacons are called daybeacons. Aerodrome beacons are used to indicate locations of airports and helipads.\n' +
            'Handheld beacons are also employed in aircraft marshalling, and are used by the marshal to deliver instructions to the crew of aircraft as they move around an active airport, heliport or aircraft carrier.\n' +
            '\n' +
            '\n' +
            '== For defensive communications (historical) ==\n' +
            '\n' +
            'Classically, beacons were fires lit at well-known locations on hills or high places, used either as lighthouses for navigation at sea, or for signalling over land that enemy troops were approaching, in order to alert defenses. As signals, beacons are an ancient form of optical telegraph and were part of a relay league.\n' +
            'Systems of this kind have existed for centuries over much of the world. The ancient Greeks called them phryctoriae, while beacons figure on several occasions on the column of Trajan.\n' +
            `In ancient China, sentinels on and near the Great Wall of China used a sophisticated system of daytime smoke and nighttime flame to send signals along long chains of beacon towers.Legend has it that Zh┼ìu Y┼ìu W├íng, king of the Western Zhou dynasty, played a trick multiple times in order to amuse his often melancholy concubine, ordering beacon towers lit to fool his Marquess and soldiers. But when enemies, led by Marquess of Shen really arrived at the wall, although the towers were lit, no defenders came, leading to Y┼ìu's death and the collapse of the Western Zhou dynasty.In the 10th century, during the ArabÔÇôByzantine wars, the Byzantine Empire used a beacon system to transmit messages from the border with the Abbasid Caliphate, across Anatolia to the imperial palace in the Byzantine capital, Constantinople. It was devised by Leo the Mathematician for Emperor Theophilos, but either abolished or radically curtailed by Theophilos' son and successor, Michael III. Beacons were later used in Greece as well, while the surviving parts of the beacon system in Anatolia seem to have been reactivated in the 12th century by Emperor Manuel I Komnenos.In Scandinavia many hill forts were part of beacon networks to warn against invading pillagers. In Finland, these beacons were called vainovalkeat, "persecution fires", or vartiotulet, "guard fires", and were used to warn Finn settlements of imminent raids by the Vikings.\n` +
            'In Wales, the Brecon Beacons were named for beacons used to warn of approaching English raiders. In England, the most famous examples are the beacons used in Elizabethan England to warn of the approaching Spanish Armada. Many hills in England were named Beacon Hill after such beacons. In England the authority to erect beacons originally lay with the King and later was delegated to the Lord High Admiral. The money due for the maintenance of beacons was called Beaconagium and was levied by the sheriff of each county. In the Scottish borders country, a system of beacon fires was at one time established to warn of incursions by the English. Hume and Eggerstone castles and Soltra Edge were part of this network.In Spain, the border of Granada in the territory of the Crown of Castile had a complex beacon network to warn against Moorish raiders and military campaigns.\n' +
            '\n' +
            '\n' +
            '== On vehicles ==\n' +
            '\n' +
            'Vehicular beacons are rotating or flashing lights affixed to the top of a vehicle to attract the attention of surrounding vehicles and pedestrians. Emergency vehicles such as fire engines, ambulances, police cars, tow trucks, construction vehicles, and snow-removal vehicles carry beacon lights.\n' +
            "The color of the lamps varies by jurisdiction; typical colors are blue and/or red for police, fire, and medical-emergency vehicles; amber for hazards (slow-moving vehicles, wide loads, tow trucks, security personnel, construction vehicles, etc.); green for volunteer firefighters or for medical personnel, and violet for funerary vehicles. Beacons may be constructed with halogen bulbs similar to those used in vehicle headlamps, xenon flashtubes, or LEDs. Incandescent and xenon light sources require the vehicle's engine to continue running to ensure that the battery is not depleted when the lights are used for a prolonged period. The low power consumption of LEDs allows the vehicle's engine to remain turned off while the lights operate nodes.\n" +
            '\n' +
            '\n' +
            '== Other uses ==\n' +
            'Beacons and bonfires are also used to mark occasions and celebrate events.   \n' +
            'Beacons have also allegedly been abused by shipwreckers. An illicit fire at a wrong position would be used to direct a ship against shoals or beaches, so that its cargo could be looted after the ship sank or ran aground. There are, however, no historically substantiated occurrences of such intentional shipwrecking.\n' +
            'In wireless networks, a beacon is a type of frame which is sent by the access point (or WiFi router) to indicate that it is on.\n' +
            'Bluetooth based beacons periodically send out a data packet and this could be used by software to identify the beacon location. This is typically used by indoor navigation and positioning applications.Beaconing is the process that allows a network to self-repair network problems. The stations on the network notify the other stations on the ring when they are not receiving the transmissions. Beaconing is used in Token ring and FDDI networks.\n' +
            '\n' +
            '\n' +
            '=== In fiction ===\n' +
            "In Aeschylus' tragedy Agamemnon, a chain of eight beacons manned by so-called lampad├│phoroi inform Clytemnestra in Argos, within a single night's time, that Troy has just fallen under her husband king Agamemnon's control, after a famous ten years siege.\n" +
            "In J. R. R. Tolkien's high fantasy novel, The Lord of the Rings, a series of beacons alerts the entire realm of Gondor when the kingdom is under attack. These beacon posts were manned by messengers who would carry word of their lighting to either Rohan or Belfalas. In Peter Jackson's film adaptation of the novel, the beacons serve as a connection between the two realms of Rohan and Gondor, alerting one another directly when they require military aid, as opposed to relying on messengers as in the novel.\n" +
            '\n' +
            '\n' +
            '=== In retail ===\n' +
            'Beacons are sometimes used in retail to send digital coupons or invitations to customers passing by.\n' +
            '\n' +
            '\n' +
            '== Types ==\n' +
            '\n' +
            '\n' +
            '=== Infrared beacon ===\n' +
            'An infrared beacon (IR beacon) transmits a modulated light beam in the infrared spectrum, which can be identified easily and positively. A line of sight clear of obstacles between the transmitter and the receiver is essential. IR beacons have a number of applications in robotics and in Combat Identification (CID).\n' +
            'Infrared beacons are the key infrastructure for the Universal Traffic Management System (UTMS) in Japan. They perform two-way communication with travelling vehicles based on highly directional infrared communication technology and have a vehicle detecting capability to provide more accurate traffic information.A contemporary military use of an Infrared beacon is reported in Operation Acid Gambit.\n' +
            '\n' +
            '\n' +
            '=== Sonar beacon ===\n' +
            'A sonar beacon is an underwater device which transmits sonic or ultrasonic signals for the purpose of providing bearing information. The most common type is that of a rugged watertight sonar transmitter attached to a submarine and capable of operating independently of the electrical system of the boat. It can be used in cases of emergencies to guide salvage vessels to the location of a disabled submarine.\n' +
            '\n' +
            '\n' +
            '== See also ==\n' +
            'Aerodrome beacon\n' +
            'Beacon mode service\n' +
            'Beacon School\n' +
            'Belisha beacon\n' +
            'Emergency locator beacon\n' +
            'Emergency position-indicating radiobeacon station (ELTs, PLBs & EPIRBs)\n' +
            'iBeacon\n' +
            'Lantern\n' +
            'Leading lights\n' +
            'Lighthouse of Alexandria\n' +
            'Milestone/Kilometric point\n' +
            'Polaris\n' +
            'Strobe beacon\n' +
            'Time ball\n' +
            'Trail blazing\n' +
            'Warning light (disambiguation)\n' +
            'Weather beacon\n' +
            'Web beacon\n' +
            '\n' +
            '\n' +
            '== References =='

    }

}