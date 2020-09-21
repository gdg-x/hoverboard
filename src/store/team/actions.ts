import { Dispatch } from 'redux';
import { Member } from '../../models/member';
import { Team, TeamWithoutMembers } from '../../models/team';
import { db } from '../db';
import { mergeId } from '../utils';
import { FETCH_TEAM, FETCH_TEAM_FAILURE, FETCH_TEAM_SUCCESS, TeamActions } from './types';

const getTeamIds = async (): Promise<TeamWithoutMembers[]> => {
  const { docs } = await db().collection('team').get();
  return docs.map<TeamWithoutMembers>(mergeId);
};

const getTeamMembers = async (team: TeamWithoutMembers): Promise<Team> => {
  const { docs } = await db().collection('team').doc(team.id).collection('members').get();

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

export const fetchTeam = () => async (dispatch: Dispatch<TeamActions>) => {
  dispatch({
    type: FETCH_TEAM,
  });

  try {
    const teams = await getTeams();
    dispatch({
      type: FETCH_TEAM_SUCCESS,
      payload: teams,
    });
  } catch (error) {
    dispatch({
      type: FETCH_TEAM_FAILURE,
      payload: error,
    });
  }
};
