import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';
import { Member } from '../../models/member';
import { Team, TeamWithoutMembers } from '../../models/team';
import { mergeDataAndId } from '../../utils/firestore';

type TeamsState = { value: RemoteData<Error, Team[]> };

export const initialTeamsState = { value: new Initialized() } as TeamsState;

const getTeamIds = async (): Promise<TeamWithoutMembers[]> => {
  const { docs } = await getDocs(query(collection(db, 'team')));

  return docs.map<TeamWithoutMembers>(mergeDataAndId);
};

const getTeamMembers = async (team: TeamWithoutMembers): Promise<Team> => {
  const { docs } = await getDocs(query(collection(db, 'team', team.id, 'members')));
  const members = docs.map<Member>(mergeDataAndId);

  return {
    ...team,
    members,
  };
};

const getTeams = async (): Promise<Team[]> => {
  const teamIds = await getTeamIds();
  return Promise.all(teamIds.map(getTeamMembers));
};

export const fetchTeams = createAsyncThunk('teams/fetch', async () => getTeams());

export const teamSlice = createSlice({
  name: 'teams',
  initialState: initialTeamsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.value = new Pending();
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.value = new Failure(action.payload);
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.value = new Success(action.payload);
      });
  },
});

export default teamSlice.reducer;
