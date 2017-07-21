const uiReducer = (state = initialState.ui, action) => {
  switch (action.type) {
    case TOGGLE_DRAWER:
      return Object.assign({}, state, {
        isDrawerOpened: action.value || !state.isDrawerOpened
      });
    case TOGGLE_VIDEO_DIALOG:
      return Object.assign({}, state,  {
        videoDialog: Object.assign({}, state.videoDialog, action.value)
      });
    case SET_VIEWPORT_SIZE:
      return Object.assign({}, state, {
        viewport: Object.assign({}, state.viewport, action.value)
      });
    default:
      return state;
  }
};

const routeReducer = (state = initialState.route, action) => {
  switch (action.type) {
    case SET_ROUTE:
      return action.route;
    default:
      return state;
  }
};

const heroReducer = (state = initialState.hero, action) => {
  switch (action.type) {
    case SET_HERO:
      return action.hero;
    default:
      return state;
  }
};

const dialogsReducer = (state = initialState.dialogs, action) => {
  switch (action.type) {
    case OPEN_DIALOG:
      return Object.assign({}, state, action.dialog);
    case CLOSE_DIALOG:
      return Object.assign({}, state, {
        [action.dialogName]: initialState.dialogs[action.dialogName]
      });
    default:
      return state;
  }
};

const ticketsReducer = (state = initialState.tickets, action) => {
  switch (action.type) {
    case FETCH_TICKETS:
      return action.tickets;
    default:
      return state;
  }
};

const partnersReducer = (state = initialState.partners, action) => {
  switch (action.type) {
    case FETCH_PARTNERS:
      return action.partners;
    default:
      return state;
  }
};

const videosReducer = (state = initialState.videos, action) => {
  switch (action.type) {
    case FETCH_VIDEOS:
      return action.videos;
    default:
      return state;
  }
};

const blogReducer = (state = initialState.blog, action) => {
  switch (action.type) {
    case FETCH_BLOG_LIST:
      return action.list;
    default:
      return state;
  }
};

const speakersReducer = (state = initialState.speakers, action) => {
  switch (action.type) {
    case FETCH_SPEAKERS_LIST:
      return action.list;
    default:
      return state;
  }
};

const galleryReducer = (state = initialState.gallery, action) => {
  switch (action.type) {
    case FETCH_GALLERY:
      return action.gallery;
    default:
      return state;
  }
};

const teamReducer = (state = initialState.team, action) => {
  switch (action.type) {
    case FETCH_TEAM:
      return action.team;
    default:
      return state;
  }
};
