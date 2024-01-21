// eslint-disable-next-line @typescript-eslint/no-var-requires
const { initializeApp, cert } = require('firebase-admin/app')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getStorage } = require('firebase-admin/storage')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getFirestore } = require('firebase-admin/firestore')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serviceAccount = require('./serviceAccountKey.json')

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'satisfy-79477.appspot.com'
})

const bucket = getStorage().bucket()
const db = getFirestore()

// Upload a file to Firebase Storage
async function uploadFile(filePath) {
  try {
    await bucket.upload(filePath, {
      destination: filePath
    })

    console.log('File uploaded successfully!')
  } catch (error) {
    console.error('Error uploading file:', error)
  }
}

async function addSong(song) {
  try {
    const docRef = db.collection('music').doc(song['id'].toString())

    await docRef.set(song)

    console.log('Create doc success')
  } catch (error) {
    console.error('Error:', error)
  }
}

module.exports = { uploadFile, addSong }
