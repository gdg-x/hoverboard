/* eslint-disable */
import fsA from 'fs'
import {Session, Speaker, Event, Track, TeamMember} from './types'

const fs = fsA.promises

const outputFile = `${__dirname}/sessions-speakers-schedule.json`

const getSocialHandle = (social: string | null) => {
  if (!social) return null
  if (social.includes("@") || !social.startsWith("http")) return social.replace('@', '')

  return social.split('/').pop()
}

export const getSpeakersSessionsScheduleFromUrl = async (url: string) => {
  const data = await fetch(url).then(r => r.json())

  return await getSpeakersSessionsSchedule(data)
}

export const mapPersonSocials = (speaker: Speaker | TeamMember) => {
  return (speaker.socials || []).map((social: { icon: string, name: string, link: string }) => {
    if (social.icon === "twitter") {
      return ({
        name: 'Twitter',
        icon: "twitter",
        link: `https://twitter.com/${getSocialHandle(social.link)}`
      })
    }
    if (social.icon === "github") {
      return ({
        name: 'Github',
        icon: "github",
        link: `https://github.com/${getSocialHandle(social.link)}`
      })
    }

    return social
  })
}

export const getSpeakersSessionsSchedule = async (payload: {
  event: Event,
  speakers: Speaker[],
  sessions: Session[],
  team: TeamMember[]
}): Promise<{}> => {
  const {event, speakers, sessions, team} = payload

  const tracks: Track[] = event.tracks.map((t: Track, index: number) => ({
    ...t,
    order: index
  }))
  const categoriesById = event.categories.reduce((acc: any, element: { id: string }) => {
    acc[element.id] = element
    return acc
  }, {})

  const speakersById = speakers.reduce((acc: any, speaker: { id: string }) => {
    acc[speaker.id] = speaker
    return acc
  }, {})

  const tracksById = tracks.reduce((acc: any, track) => {
    acc[track.id] = track
    return acc
  }, {})
  const tracksAsSchedule = tracks.map((track) => {
    return {
      title: track.name,
    }
  })
  console.log(`Received ${speakers.length} speakers, ${sessions.length} sessions for event named ${event.name}`)

  console.log('Formatting output data')
  const outputSpeakers = speakers.reduce((acc: any, speaker: any) => {
    acc[speaker.id] = {
      bio: speaker.bio,
      company: speaker.company || "",
      companyLogoUrl: speaker.companyLogoUrl || "",
      country: speaker.geolocation,
      name: speaker.name,
      photoUrl: speaker.photoUrl,
      shortBio: speaker?.bio?.slice(0, 100) + "...",
      title: speaker.jobTitle || "",
      socials: mapPersonSocials(speaker)
    }
    return acc
  }, {})
  console.log(`Found ${Object.keys(outputSpeakers).length} speakers`)

  const outputSessions = sessions.reduce((acc: any, talk: any) => {
    acc[talk.id] = {
      title: talk.title,
      complexity: talk.level,
      description: (talk.abstract || ""),
      language: "French",
      tags: talk.categoryId ? [categoriesById[talk.categoryId].name] : [],
      speakers: talk.speakerIds.map((speakerId: string) => speakersById[speakerId].id),
      presentation: talk.presentationLink,
      videoId: talk.videoLink || null,
      image: talk.imageUrl || null,
      hideInFeedback: !talk.showInFeedback,
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
  const sortedSessions = Object.values(sessions).sort((a: any, b: any) => {
    const aDate = new Date(a.dateEnd)
    const bDate = new Date(b.dateEnd)
    return aDate.getTime() - bDate.getTime()
  })

  // const track = session.track.length ? session.track[0] : "Other"
  // 2. Group by weekday
  console.log('Grouping sessions')
  const groupedSessions = sortedSessions.reduce<Record<string, object[]>>((acc, talk: any) => {
    if (!talk.dateStart) {
      acc[""] = acc[""] || []
      acc[""].push(talk)
      return acc
    }
    const day = new Date(talk.dateStart).toISOString().split('T')[0]

    // @ts-ignore
    if (!acc[day]) acc[day] = []
    // @ts-ignore
    acc[day].push(talk)
    return acc
  }, {})

  // 3. Group by hour & minutes
  console.log('Grouping sessions by hour')
  const groupedSessionsByHour = Object.entries(groupedSessions).reduce((acc: any, [day, talks]: any) => {
    const groupedByHour = talks.reduce((acc: any, talk: any) => {
      try {
        // @ts-ignore
        const startTime = new Date(talk.dateStart).toISOString().split('T')[1].split(':')
        // @ts-ignore
        const endTime = new Date(talk.dateEnd).toISOString().split('T')[1].split(':')
        // @ts-ignore
        const startHour = parseInt(startTime[0]) + 2
        const startMinutes = startTime[1]
        // @ts-ignore
        const endHour = parseInt(endTime[0]) + 2
        const endMinutes = endTime[1]
        const startTimeString = `${startHour < 10 ? "0" + startHour : startHour}:${startMinutes}`
        const endTimeString = `${endHour < 10 ? "0" + endHour : endHour}:${endMinutes}`
        if (!acc[startTimeString]) acc[startTimeString] = {
          startTime: startTimeString,
          endTime: endTimeString,
          sessions: []
        }

        // Important stuff happen here to add session in line or vertical, etc
        type TempSessionItems = {
          items: {
            id: string,
            trackIndex: number
          }[],
          extend?: number
        }
        const track = talk.track || null
        let trackIndex = tracks.length
        if (track) {
          const trackObject = tracksById[track]
          trackIndex = parseInt(trackObject.order)
        }

        const items: TempSessionItems = {
          items: [{
            ...talk,
            trackIndex
          }]
        }
        if (talk.extendHeight) {
          items.extend = parseInt(talk.extendHeight)
        }
        acc[startTimeString].sessions.push(items)

        return acc
      } catch (error) {
        console.log("Error on talk in groupedSessionsByHour", talk)
        console.error(error)
        process.exit(1)
      }
    }, {})
    acc[day] = Object.values(groupedByHour).map(
      (timeslot: any) => {
        // We put the items into an indexed object to have blank & the correct track order
        const sessions = Object.values(timeslot.sessions.reduce((acc: any, session: any) => {

          const track = tracksById[session.items[0].trackId]

          acc[track.order] = {
            ...session,
            items: session.items.map((item: any) => item.id)
          }

          // If the first session item is "hideTrackTitle" = not a talk, we remove the empty array to take full width
          if (session.items[0] && session.items[0].extendWidth) {
            tracks.forEach((track: any) => {
              if (track.order > 0) {
                delete acc[track.order]
              }
            })
          }

          return acc
        }, tracks.reduce((acc: any, track: any) => {
          acc[track.order] = {
            items: [],
          }
          return acc
        }, {})))

        return {
          ...timeslot,
          sessions: sessions
        }

      })
    return acc
  }, {})
  // console.log(JSON.stringify(groupedSessionsByHour, null, 4))
  // 4. Merge as schedule format
  console.log('Merging sessions')
  const dateFormat = {weekday: 'long', month: 'long', day: 'numeric'}
  Object.keys(groupedSessionsByHour).forEach(day => {
    schedule[day] = {
      date: day,
      // @ts-ignore
      dateReadable: new Date(Date.parse(day)).toLocaleDateString('fr-FR', dateFormat),
      timeslots: groupedSessionsByHour[day],
      tracks: tracksAsSchedule,
    }
  })

  delete schedule["1"]

  // 5. Add team members
  console.log('Adding team, ' + team.length + ' members')
  const teamMembers = team.map((member: TeamMember) => {
    return {
      name: member.name,
      role: member.role,
      photoUrl: member.photoUrl,
      socials: mapPersonSocials(member)
    }
  })

  console.log("Formatting output data done!")

  const fileContent = {
    speakers: outputSpeakers,
    sessions: outputSessions,
    schedule: schedule,
    team: teamMembers
  }

  await fs.writeFile(outputFile, JSON.stringify(fileContent, null, 4))
  console.log("File saved to " + outputFile)

  return fileContent
}
