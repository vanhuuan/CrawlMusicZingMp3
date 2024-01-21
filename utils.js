// eslint-disable-next-line @typescript-eslint/no-var-requires
const axios = require('axios')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs')

const downloadFile = async (url, outputPath) => {
  const response = await axios({
    method: 'get',
    url: url,
    responseType: 'stream'
  })

  response.data.pipe(fs.createWriteStream(outputPath))

  return new Promise((resolve, reject) => {
    response.data.on('end', () => {
      resolve()
    })

    response.data.on('error', (err) => {
      reject(err)
    })
  })
}

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time))
}

module.exports = { downloadFile, delay }
