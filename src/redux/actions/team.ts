import { FETCH_TEAM, FETCH_TEAM_FAILURE, FETCH_TEAM_SUCCESS } from '../constants';

const _getTeamMembers = (teamId) =>
  window.firebase
    .firestore()
    .collection('team')
    .doc(teamId)
    .collection('members')
    .get()
    .then((snaps) => snaps.docs.map((snap) => Object.assign({}, snap.data(), { id: snap.id })));

export const teamActions = {
  fetchTeam: () => (dispatch) => {
    dispatch({
      type: FETCH_TEAM,
    });

    window.firebase
      .firestore()
      .collection('team')
      .get()
      .then((snaps) =>
        Promise.all(
          snaps.docs.map((snap) => Promise.all([snap.data(), snap.id, _getTeamMembers(snap.id)]))
        )
      )
      .then((teams) =>
        teams.map(([team, id, members]) => {
          return Object.assign({}, team, { id, members });
        })
      )
      .then((list) => {
        dispatch({
          type: FETCH_TEAM_SUCCESS,
          payload: {
            list,
          },
        });
      })
      .catch((error) => {
        dispatch({
          type: FETCH_TEAM_FAILURE,
          payload: { error },
        });
      });
  },
};
