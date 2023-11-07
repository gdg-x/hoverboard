import { getSpeakersSessionsScheduleFromUrl } from './getSpeakersSessionsSchedule'

const main = async () => {
  if (!process.env['CONFERENCE_CENTER_FILE']) {
    throw new Error('missing CONFERENCE_CENTER_FILE env')
  }

  await getSpeakersSessionsScheduleFromUrl(process.env["CONFERENCE_CENTER_FILE"]+"?t="+Date.now())

  console.log("done")
}


main()
