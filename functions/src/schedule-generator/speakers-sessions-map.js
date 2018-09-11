function sessionsSpeakersMap(sessionsRaw, speakersRaw) {
    const sessions = {};
    const speakers = {};

    for (let index = 0; index < Object.keys(sessionsRaw).length; index++) {
        const sessionId = Object.keys(sessionsRaw)[index];
        const currentSession = sessionsRaw[sessionId];
        const sessionSpeakers = [];
        const mainTag = currentSession.tags ? currentSession.tags[0] : 'General';

        currentSession.speakers &&
            currentSession.speakers.forEach(speakerId => {
                if (!speakersRaw[speakerId]) return;
                sessionSpeakers.push(Object.assign({}, { id: speakerId }, speakersRaw[speakerId]));

                const generatedSpeaker = speakers[speakerId];
                const sessionBySpeaker = Object.assign({}, currentSession, { id: sessionId, mainTag: mainTag });

                if (generatedSpeaker) {
                    const speakerTags = generatedSpeaker.tags ? [...generatedSpeaker.tags] : [];
                    sessionBySpeaker.tags && sessionBySpeaker.tags.forEach(tag => {
                        if (!speakerTags.includes(tag)) speakerTags.push(tag);
                    });
                    const speakerSessions = (generatedSpeaker.sessions) ?
                    [...generatedSpeaker.sessions, sessionBySpeaker] :
                    [sessionBySpeaker];

                    speakers[speakerId] = Object.assign({}, generatedSpeaker, {
                        sessions: speakerSessions,
                        tags: [...speakerTags]
                    });
                }
                else {
                    speakers[speakerId] = Object.assign({},
                        speakersRaw[speakerId],
                        { id: speakerId, tags: sessionBySpeaker.tags, sessions: [sessionBySpeaker] });
                }
            });

        sessions[sessionId] = Object.assign({}, currentSession,
            { id: sessionId, mainTag: mainTag, speakers: sessionSpeakers });
    };

    return { sessions, speakers };
}

export default sessionsSpeakersMap;