const { promisify } = require('util')
const parse = promisify(require('csv-parse'))
const fs = require('fs')
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const { resolve } = require('path')
const ref = require('./firebase-config')

const loadCsvAsJson = async () => {
  const path = resolve('Team Details - Team Members.csv')
  let csvStr = await readFile(path, 'utf8')
  csvStr = csvStr.replace(` (e.g. Website, Ticketing, General)`, '')
  csvStr = csvStr.replace(` Link (can be internal dropbox, public location, etc)`, '')
  return parse(csvStr, { columns: true })
}

const ranks = [
  'Founder',
  'Executive',
  'Deputy Director',
  'Captain',
  'Lead',
]

const rankMembers = items => items.sort((a, b) => {
  for (let r of ranks) {
    if (a.Role.includes(r)) return -1
    else if (b.Role.includes(r)) return 1
  }
  return 0
})

const baseImgUrl = 'https://firebasestorage.googleapis.com/v0/b/hoverboard-site-8fb1d.appspot.com/o/team%2F'

const restructure = items => items.map((item, order) => {
  const output = {
    photo: '',
    photoUrl: item.Photo ? `${baseImgUrl}${encodeURIComponent(item.Name)}.jpg?alt=media` : '',
    name: item.Name,
    socials: [],
    title: item.Role,
    order
  }

  if (item.LinkedIn) {
    const comps = item.LinkedIn.split('/')
    const id = comps.pop() || comps.pop()
    output.socials.push({
      icon: 'linkedin',
      link: `https://www.linkedin.com/in/${id}`,
      name: 'LinkedIn'
    })
  }
  if (item.Twitter) {
    output.socials.push({
      icon: 'twitter',
      link: `https://twitter.com/${item.Twitter.replace('@', '')}`,
      name: 'Twitter'
    })
  }
  if (item['Website Link']) {
    output.socials.push({
      icon: 'website',
      link: item['Website Link'],
      name: 'Website'
    })
  }
  if (item.Facebook) {
    output.socials.push({
      icon: 'facebook',
      link: `https://www.facebook.com/${item.Facebook}`,
      name: 'Facebook'
    })
  }
  return output
})

const main = async () => {
  const items = await loadCsvAsJson()
  const members = restructure(rankMembers(items))
  const output = JSON.stringify({
    title: '',
    members,
  }, null, 2)
  await writeFile(resolve('./team.json'), output, 'utf8')

  await ref.initializeFirebase()

  const batch = ref.firestore.batch();
  members.forEach((member, id) => {
    batch.set(
      ref.firestore.collection('team').doc('0').collection('members').doc(`${id}`),
      member,
    );
  })
  try {
    await batch.commit()
  } catch (e) {
    console.error(e)
  }
}

main()
