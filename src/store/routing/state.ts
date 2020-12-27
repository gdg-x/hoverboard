export interface RoutingState {
  route: string;
  subRoute?: string;
}

export const initialRoutingState: RoutingState = {
  route: 'home',
};
