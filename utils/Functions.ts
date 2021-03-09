import readline from 'readline'

export async function chooseOneIn(selectList:string[]){

    let rl: readline.Interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })
    
    console.log('\nSelecione um:')

    selectList.map((item, index) => {

        console.log(`[${index}] - ${item}`)

    })

    const it = rl[Symbol.asyncIterator]()
    const selectedIndex = parseInt((await it.next()).value)

    rl.close()

    return selectedIndex < selectList.length ? selectedIndex : -1

}