const fs = require('fs').promises
const { Client } = require("@notionhq/client")

const notion = new Client({
  auth: process.env.notionToken,
})

const outputFile = `${__dirname}/../../data/sessions-speakers-schedule.json`

const getNotionPagesData = async (databaseId: string) => {
  const pagesIds = await getNotionPagesIds(databaseId)
  return await Promise.all(pagesIds.map(async (pageId: string) => {
    return await notion.pages.retrieve({ page_id: pageId })
  }))
}

const getNotionPagesIds = async (database: string, totalPagesIds: string[] = []): Promise<string[]> => {
  const response = await notion.databases.query({
    database_id: database,
  })
  const ids = [...totalPagesIds, ...response.results.map((page: any) => page.id)]
  if (response.has_more) {
    return getNotionPagesIds(database, ids)
  }
  return ids
}

const notionFormatToFlatObject = (pagesData: any) => {
  if (pagesData.length === 0) return []
  const keys = Object.keys(pagesData[0].properties)
  return pagesData.map((data: any) => {
    return keys.reduce((acc: any, key) => {
      const property = data.properties[key]

      switch (property.type) {
        case "title":
          acc[key] = property.title[0]?.plain_text
          break
        case "rich_text":
          acc[key] = property.rich_text[0]?.plain_text
          break
        case "relation":
          acc[key] = property.relation?.map((relation: {id: string}) => relation.id)
          break
        case "date":
          if(property.date) acc[key] = property.date.start
          break
        case "checkbox":
          acc[key] = property.checkbox
          break
        default:
          console.log("unknown", property)
          break
      }
      return acc
    }, {
      id: data.id,
    })
  })
}
const getSocialHandle = (social: string | null) => {
  if(!social) return null
  if(social.includes("@") || !social.startsWith("http")) return social.replace('@', '')

  return social.split('/').pop()
}


const syncFromNotion = async (speakerDBId: string, proposalsDBId: string) => {
  console.log('Syncing from Notion')

  console.log('Getting data from notion, speakers')
  const nSpeakers = notionFormatToFlatObject(await getNotionPagesData(speakerDBId))
  const nSpeakersById = nSpeakers.reduce((acc: any, speaker: { id: string }) => {
    acc[speaker.id] = speaker
    return acc
  }, {})
  console.log('Getting data from notion, talks')
  const nTalks = notionFormatToFlatObject(await getNotionPagesData(proposalsDBId))

  console.log('Getting data from notion done!')

  // 1. Remove speaker on notion not present here

  console.log('Formatting output data')
  const outputSpeakers = nSpeakers.reduce((acc: any, notionSpeaker: any) => {
    const twitter = getSocialHandle(notionSpeaker.twitter)
    const github = getSocialHandle(notionSpeaker.github)

    const socials = []
    if(twitter) {
      socials.push({
        name: 'Twitter',
        icon: "twitter",
        url: `https://twitter.com/${twitter}`
      })
    }
    if(github) {
      socials.push({
        name: 'Github',
        icon: "github",
        url: `https://github.com/${github}`
      })
    }

    acc[notionSpeaker.cid] = {
      bio: notionSpeaker.bio,
      company: notionSpeaker.company,
      companyLogoUrl: notionSpeaker.companyLogoUrl,
      country: notionSpeaker.city,
      name: notionSpeaker.name,
      photoUrl: notionSpeaker.photoURL,
      socials: socials,
      shortBio: notionSpeaker.shortBio,
      title: notionSpeaker.title,
    }

    return acc
  }, {})
  console.log(`Found ${Object.keys(outputSpeakers).length} speakers`)

  const outputSessions = nTalks.reduce((acc: any, talk: any) => {
    acc[talk.cid || talk.id] = {
      title: talk.title,
      complexity: talk.level,
      description: talk.description + talk.description2,
      language: "French",
      tags: talk.categories ? [talk.categories] : [],
      speakers: talk.speakers.map((speakerId: string) => nSpeakersById[speakerId].cid),
      presentation: null,
      videoId: null,
      image: talk.image || null,
      hideInFeedback : talk.hideInFeedback,
      hideTrackTitle: talk.hideTrackTitle,
    }

    return acc
  }, {})
  console.log(`Found ${Object.keys(outputSessions).length} sessions`)

  console.log("Formatting output data done!")

  await fs.writeFile(outputFile, JSON.stringify({
    speakers: outputSpeakers,
    sessions: outputSessions,
    schedule: {}
  }, null, 4))

  console.log("File saved to " + outputFile)
}

const main = async () => {
  if(!process.env.notionSpeakersId || !process.env.notionTalksId || !process.env.notionToken) {
    console.log("Please set notionToken, notionSpeakersId and notionTalksId env variables")
    process.exit(1)
    return
  }

  console.log(process.env.notionSpeakersId)

  await syncFromNotion(process.env.notionSpeakersId, process.env.notionTalksId)
}

main()
