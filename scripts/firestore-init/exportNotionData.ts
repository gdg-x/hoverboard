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
          if(property.date) {
            acc[key] = property.date.start
            acc["dateEnd"] = property.date.end
          }
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


const syncFromNotion = async (speakerDBId: string, proposalsDBId: string, tracksDBId: string) => {
  console.log('Syncing from Notion')

  console.log('Getting data from notion, speakers')
  const nSpeakers = notionFormatToFlatObject(await getNotionPagesData(speakerDBId))
  const nSpeakersById = nSpeakers.reduce((acc: any, speaker: { id: string }) => {
    acc[speaker.id] = speaker
    return acc
  }, {})
  console.log('Getting data from notion, talks')
  const nTalks = notionFormatToFlatObject(await getNotionPagesData(proposalsDBId))
  const nTracks = notionFormatToFlatObject(await getNotionPagesData(tracksDBId))
  const tracksAsSchedule = nTracks.map((track: { id: string, name: string }) => {
    return {
      title: track.name,
    }
  })

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
      description: (talk.description || "") + (talk.description2 ? talk.description2 : ""),
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


  const schedule: {
    [key: string]: {
      date: string,
      dateReadable: string,
      timeslots: {
        startTime: string,
        endTime: string,
        sessions: {
          items: string[],
        }[]
      }[],
      tracks: {
        title: string,
      }[]
    }
  } = {
    "1": {
      date: "",
      dateReadable: "2020-06-01",
      timeslots: [],
      tracks: [],
    },
  }

  // 1. Sort by date
  console.log('Sorting sessions')
  const sortedSessions = Object.values(nTalks).sort((a: any, b: any) => {
    const aDate = new Date(a.date)
    const bDate = new Date(b.date)
    return aDate.getTime() - bDate.getTime()
  })

  // const track = session.track.length ? session.track[0] : "Other"
  // 2. Group by weekday
  console.log('Grouping sessions')
  const groupedSessions = sortedSessions.reduce<Record<string, object[]>>((acc, talk: any) => {
    if(!talk.date) {
      acc[""] = acc[""] || []
      acc[""].push(talk)
      return acc
    }
    const day = new Date(talk.date).toISOString().split('T')[0];
    if(!acc[day]) acc[day] = []
    acc[day].push(talk)
    return acc
  }, {})

  // 3. Group by hour & minutes
  console.log('Grouping sessions by hour')
  const groupedSessionsByHour = Object.entries(groupedSessions).reduce((acc: any, [day, talks]: any) => {
    const groupedByHour = talks.reduce((acc: any, talk: any) => {
      const startTime = new Date(talk.date).toISOString().split('T')[1].split(':')
      const endTime = new Date(talk.dateEnd).toISOString().split('T')[1].split(':')
      const startHour = parseInt(startTime[0]) +2
      const startMinutes = startTime[1]
      const endHour = parseInt(endTime[0]) +2
      const endMinutes = endTime[1]
      const startTimeString = `${startHour}:${startMinutes}`
      const endTimeString = `${endHour}:${endMinutes}`
      if(!acc[startTimeString]) acc[startTimeString] = {
        startTime: startTimeString,
        endTime: endTimeString,
        sessions: []
      }
      // Important stuff happen here to add session in line or vertical, etc
      acc[startTimeString].sessions.push({
        items: [talk.cid || talk.id]
      })
      return acc
    }, {})
    acc[day] = Object.values(groupedByHour)
    return acc
  }, {})
  console.log(groupedSessionsByHour)

  // 4. Merge as schedule format
  console.log('Merging sessions')
  Object.keys(groupedSessionsByHour).forEach(day => {
    schedule[day] = {
      date: day,
      dateReadable: day,
      timeslots: groupedSessionsByHour[day],
      tracks: tracksAsSchedule,
    }
  })

  delete schedule["1"]



  console.log("Formatting output data done!")

  await fs.writeFile(outputFile, JSON.stringify({
    speakers: outputSpeakers,
    sessions: outputSessions,
    schedule: schedule
  }, null, 4))
  await fs.writeFile(outputFile + "schedule.json", JSON.stringify({
    schedule
  }, null, 4))

  console.log("File saved to " + outputFile)
}

const main = async () => {
  if(!process.env.notionSpeakersId || !process.env.notionTalksId || !process.env.notionToken ||
    !process.env.notionTracksId) {
    console.log("Please set notionToken, notionSpeakersId and notionTalksId env variables")
    process.exit(1)
    return
  }

  await syncFromNotion(process.env.notionSpeakersId, process.env.notionTalksId, process.env.notionTracksId)
}

main()
