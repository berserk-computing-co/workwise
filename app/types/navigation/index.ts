import { type BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { type PersonnelGroup } from '../api';
import { type ProjectResponse, type UserResponse } from '../api/interfaces';
import { type FileResponseType } from '../files';
import { type Bid } from '..';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

export interface UserListRouteParams {
  onSelectUser?: (client: UserResponse) => void;
}

export interface ProjectEmployeeListRouteParams extends UserListRouteParams {
  project: ProjectResponse;
}

export interface PersonnelPickerRouteParams {
  onSelectPersonnelGroup?: (personnelGroup: PersonnelGroup) => void;
}

export interface RootStackParamList {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Settings: undefined;
  Onboarding: undefined;
  CreateProject: undefined;
  CreateBid: undefined;
  CreateUser: undefined;
  CreateContact: undefined;
  CreateEmployee: undefined;
  UpdateContractor: undefined;
  AddEquipment: undefined;
  CreateMaterial: undefined;
  ProjectDetail: {
    project: ProjectResponse,
  };
  BidDetail: {
    bid?: Bid;
  };
  UpdateBidInfo: {
    bid: Bid
  }
  CreateEstimateItem: {
    phaseName?: string;
  };
  UserDetails: {
    user: UserResponse;
  };
  UserList: UserListRouteParams;
  ClientList: UserListRouteParams;
  EmployeeList: UserListRouteParams;
  ProjectEmployeeList: ProjectEmployeeListRouteParams;
  ProjectFileList: {
    project: ProjectResponse;
  };
  FileConfirmation: {
    onConfirm: (result: FileResponseType, filename: string) => void,
    fileOrPhotoResult: FileResponseType,
    defaultFilename?: string,
  };
  PersonnelPicker: PersonnelPickerRouteParams;
  CreatePersonnelGroup: undefined;
  CreatePhase: undefined;
  UpdateEstimate: {
    bidId: number;
  };
  NewEstimateVersion: {
    bidId: number;
  };
}

export type RootStackScreenProps<Screen extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, Screen>;

export interface RootTabParamList {
  Home: undefined;
  Clients: undefined;
  Projects: undefined;
  Bids: undefined;
}

export type RootTabScreenProps<Screen extends keyof RootTabParamList> =
  CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
  >;
