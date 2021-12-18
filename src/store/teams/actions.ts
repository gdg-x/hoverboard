import { collection, getDocs, query } from 'firebase/firestore';
import { Dispatch } from 'redux';
import { db } from '../../firebase';
import { Member } from '../../models/member';
import { Team, TeamWithoutMembers } from '../../models/team';
import { mergeId } from '../../utils/merge-id';
import { FETCH_TEAMS, FETCH_TEAMS_FAILURE, FETCH_TEAMS_SUCCESS, TeamsActions } from './types';

const getTeamIds = async (): Promise<TeamWithoutMembers[]> => {
  const { docs } = await getDocs(query(collection(db, 'team')));

  return docs.map<TeamWithoutMembers>(mergeId);
};

const getTeamMembers = async (team: TeamWithoutMembers): Promise<Team> => {
  const { docs } = await getDocs(query(collection(db, 'team', team.id, 'members')));
  const members = docs.map<Member>(mergeId);

  return {
    ...team,
    members,
  };
};

const getTeams = async (): Promise<Team[]> => {
  const teamIds = await getTeamIds();
  return Promise.all(teamIds.map(getTeamMembers));
};

export const fetchTeams = () => async (dispatch: Dispatch<TeamsActions>) => {
  dispatch({
    type: FETCH_TEAMS,
  });

  try {
    dispatch({
      type: FETCH_TEAMS_SUCCESS,
      payload: await getTeams(),
    });
  } catch (error) {
    dispatch({
      type: FETCH_TEAMS_FAILURE,
      payload: error,
    });
  }
};
