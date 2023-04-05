export interface Track {
    id: string
    name: string
}
export interface Category {
    id: string
    name: string
    color?: string
}

export interface Format {
    id: string
    name: string
    durationMinutes: number
}

export interface DateType {
    start: string | null
    end: string | null
}
export interface DateTimeType {
    start: string | null
    end: string | null
}

export interface SpeakerSocial {
    name: string
    icon: string
    link: string
}

export interface Speaker {
    id: string
    email: string | null
    phone: string | null
    conferenceHallId: string | null
    name: string
    jobTitle: string | null
    bio: string | null
    company: string | null
    companyLogoUrl: string | null
    geolocation: string | null
    photoUrl: string | null
    socials: SpeakerSocial[]
    note: string | null
}

export interface Session {
    id: string
    conferenceHallId: string | null
    title: string
    abstract: string | null
    dates: DateTimeType | null
    durationMinutes: number
    speakers: string[]
    trackId: string | null
    language: string | null
    level: string | null
    presentationLink: string | null
    videoLink: string | null
    tags: string[]
    format: string | null
    category: string | null
    image: string | null
    showInFeedback: boolean
    hideTrackTitle: boolean
    note: string | null
    extendHeight?: number
    // Hydrated data during load
    speakersData?: Speaker[]
    formatText?: string
    categoryObject?: Category
}


export interface Event {
    id: string
    name: string
    owner: string
    scheduleVisible: boolean
    members: string[]
    conferenceHallId: string | null
    dates: DateType
    formats: Format[]
    categories: Category[]
    tracks: Track[]
    createdAt: Date
    updatedAt: Date
}
