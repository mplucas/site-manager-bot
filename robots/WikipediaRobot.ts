import { Content } from "../interfaces";
import superAgent from 'superagent';
import unicode from 'unidecode';
import { chooseOneIn } from "../utils/Functions";

export class WikipediaRobot{

    private images:string[] = [];
    private ctn:string = '';
    private title:string = '';
    private summary:string =''
    private pageid:string = '';
    private url:string = '';
    private links:string[] = [];
    private references:string[] = [];
    
    private content:Content;

    constructor(content:Content){
        this.content = content;
    }

    public async run(){
        
        console.log('Fetching from Wikipedia...')
        await this.fetchFromWikipedia()
        console.log('Searching content...')
        await this.getContent()
        console.log('Building object to others Robots...')
        const algorithmiaLikeObject = this.buildAlgorithmiaLikeObject()

        this.content.sourceContentOriginal = algorithmiaLikeObject.content

    }

    private async fetchFromWikipedia(){

        const res = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action':'opensearch',
            'search':''+this.content.searchTerm,
            'limit':5,
            'namespace':0,
            'format':"json"
        })

        if(res.body[1].length == 0){
            console.log('Your search term don\'t return any result')
            console.log('Tip: Search your therm in English or pre-search valid Words')
            console.log('Exiting Program...')
            process.exit()
        }

        let sugestions = []

        res.body[1].forEach(e => {
            sugestions.push(unicode(e))
        });

        let index = await chooseOneIn(sugestions)

        if(index == -1){
            console.log('You don\'t selected any key')
            console.log('Exiting Program...')
            process.exit()
        }

        this.url = res.body[3][index]

        this.title = res.body[1][index]

    }

    private async getContent(){

        const ret = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action':'query',
            'prop': 'extracts|images|links|info|extlinks',
            'redirects': 1,
            'exsectionformat':'wiki',
            'explaintext':true,
            'titles':this.title,
            'format':"json"
        })

        let value
        let pages = new Map(Object.entries(ret.body.query.pages));
        pages.forEach(e => {
            value = e;
        })

        try{

            value.links.forEach(e => {
                this.links.push(e.title)
            })

        }catch(Ex){
            console.log('----------------------------')
            console.log('Any Links in this search')
            console.log('----------------------------')
        }

        try{
            value.extlinks.forEach(e => {
                this.references.push(e['*'])
            })
        }catch(Ex){
            console.log('----------------------------')
            console.log('Any Reference in this search')
            console.log('----------------------------')
        }

        this.pageid = value.pageid;
        this.ctn = value.extract;
        this.summary =  value.extract.split('\n\n\n')[0]

        console.log("Fetching Images...")
        for (let i = 0; i < value.images.length; i++) {
            await this.getURLImage(value.images[i].title);
        }
        
    }

    private async getURLImage(title: string){
        
        const ret = await superAgent.get('https://en.wikipedia.org/w/api.php').query({
            'action':'query',
            'prop': 'imageinfo',
            'titles':title,
            'format':"json",
            'iiprop':'url'
        })

        let values = []
        let pages = new Map(Object.entries(ret.body.query.pages));
        pages.forEach((page:any) => {
            page.imageinfo.forEach(info => {
              values.push(info.url)
            })
        })

        values.forEach(e => {
          this.images.push(e);
        })
    }

    private buildAlgorithmiaLikeObject(){
        
        return {
            content: this.ctn,
            images:  this.images,
            links: this.links,
            pageid:this.pageid,
            references:this.references,
            summary: this.summary,
            title: this.title,
            url: this.url
        }
        
    }

}