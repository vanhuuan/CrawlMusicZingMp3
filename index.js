/* eslint-disable @typescript-eslint/no-var-requires */
const puppeteer = require('puppeteer')
const { downloadFile, delay } = require('./utils.js')
const { uploadFile, addSong } = require('./firebaseService.js')
const fs = require('fs')
const urls = require('url')
const path = require('path')
const url = process.argv[2]
if (!url) {
  throw 'Please provide URL as a first argument'
}
var listChart = []
async function run() {
  if (!fs.existsSync('music')) {
    fs.mkdirSync(path.join(__dirname, 'music'), { recursive: true })
  }
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.on('response', async (response) => {
    if (response.request().url().startsWith('https://zingmp3.vn/api/v2/song/get/streaming')) {
      try {
        const parsedUrl = urls.parse(response.request().url(), true)
        const params = parsedUrl.query
        let body = await response.json()
        console.log(params['id'])
        let linkDownload = body['data']['128'].toString()
        let song = listChart.find((x) => x['encodeId'].toString() === params['id'].toString())

        if (!song) {
          throw 'Not exist!'
        }

        // Save song
        let dir = `music/${params['id']}`
        if (!fs.existsSync(dir)) {
          await fs.promises.mkdir(dir, { recursive: true })
        }

        const outputPath = `${dir}/${song['title']}.mp3`
        console.info(outputPath)
        await downloadFile(linkDownload, outputPath)
          .then(() => {
            console.log('File downloaded successfully.')
          })
          .catch((err) => {
            console.error('Error downloading file:', err)
          })

        // Save song info
        const jsonString = JSON.stringify(song, null, 2)
        fs.writeFileSync(`${dir}/${song['title']}.json`, jsonString)

        // Upload to firebase storage
        await delay(2000)
        await uploadFile(outputPath)
        await uploadFile(`${dir}/${song['title']}.json`)

        // Download thumnail
        await downloadFile(song['thumbnailM'], `${dir}/thumbnal.jpg`)
          .then(() => {
            console.log('Thumbnal downloaded successfully.')
          })
          .catch((err) => {
            console.error('Error downloading file:', err)
          })
        await uploadFile(`${dir}/thumbnal.jpg`)

        addSong({
          id: song['encodeId'].toString(),
          name: song['title'].toString(),
          artist: song['artistsNames'].toString(),
          duration: song['duration'],
          releaseDate: song['releaseDate'],
          genres: song['genreIds']
        })
      } catch (err) {
        console.error(err)
      }
    }

    if (response.request().url().startsWith('https://zingmp3.vn/api/v2/page/get/chart-home')) {
      let body = await response.json()
      listChart = body['data']['RTChart']['items']
      if (fs.existsSync(`songs.json`)) {
        fs.rmSync(`songs.json`)
      }
      fs.writeFileSync(`songs.json`, JSON.stringify(listChart, null, 2))
    }

    if (response.request().url().startsWith('https://zingmp3.vn/api/v2/page/get/playlist')) {
      try {
        let body = await response.json()
        if (body['data']['song']['items']) listChart = body['data']['song']['items']
        if (fs.existsSync(`songs.json`)) {
          fs.rmSync(`songs.json`)
        }
        fs.writeFileSync(`songs.json`, JSON.stringify(listChart, null, 2))
      } catch (err) {
        console.error(err)
      }
    }

    if (response.request().url().startsWith('https://zingmp3.vn/api/v2/lyric/get/lyric')) {
      try {
        const parsedUrl = urls.parse(response.request().url(), true)
        const params = parsedUrl.query
        let body = await response.json()
        let song = listChart.find((x) => x['encodeId'].toString() === params['id'].toString())

        if (!song || song['encodeId'] != params['id']) {
          throw 'Not exist!'
        }

        let dir = `music/${params['id']}`
        const jsonString = JSON.stringify(body, null, 2)
        fs.writeFileSync(`${dir}/lyric.json`, jsonString)

        // Upload to firebase storage
        delay(1000)
        uploadFile(`${dir}/lyric.json`)
      } catch (err) {
        console.error(err)
      }
    }
  })

  await page.goto(url)

  if (url.includes('zing-chart')) {
    var get100 = await page.$('.zm-btn.show-all.is-outlined.button')
    await get100.click()
  }

  await page.waitForTimeout(3000)
  page.screenshot({
    path: 'screenshot.jpg'
  })
  await delay(3000)
  var buttons = await page.$$('.zm-actions-container')
  buttons.shift()
  console.info(buttons.length)
  for (const button of buttons) {
    try {
      await button.click()
      await page.waitForTimeout(3000)
      var getLyricButton = await page.$('.btn-karaoke')
      console.log('click kara')
      await getLyricButton.click()
      await page.waitForTimeout(3000)
      var close = await page.$('.level-item button.zm-btn:has(i.icon.ic-go-down)')
      console.log('click lyric')
      await close.click()
      await page.waitForTimeout(1000)
    } catch (err) {
      console.error(err)
    }
  }
  console.info('Finished, click to end')
}

run()
