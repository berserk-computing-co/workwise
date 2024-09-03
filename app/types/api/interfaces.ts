import { type BidStatus } from './bids';

export const USER_TYPES: UserType[] = [
  'Laborer', 'Contractor', 'Admin', 'Carpenter', 'CustomUser'
];
export type UserType = 'Contractor' | 'Laborer' | 'Carpenter' | 'Admin' | 'CustomUser' | 'Client';
export type EstimatableType = 'Expense' | 'Material';
export type FolderType = 'ProjectFolder' | 'ContractorFolder';

export const isUserType = (potentialType: string): potentialType is UserType => {
  return potentialType === 'Contractor' ||
    potentialType === 'Laborer' ||
    potentialType === 'Carpenter' ||
    potentialType === 'Admin' ||
    potentialType === 'CustomUser' ||
    potentialType === 'Client';
};

// Basic Types
export interface Address {
  id: number;
  street: string;
  streetSuffix: string;
  city: string;
  state?: string;
  zip?: string;
  fullAddress?: string;
}

export type AddressAttributes = Omit<Address, 'id'>;

export const isAddress = (address: Partial<Address>): address is Address => {
  return (address as Address).street !== undefined ||
    (address as Address).city !== undefined;
};

export interface Associated {
  id: number;
  title?: string;
  name?: string;
}

// Request Types
export interface UserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  loginEnabled: boolean;
  addressAttributes: Partial<Address>;
  projectIds: number[];
  personnelGroupId?: number;
}

export interface AdminRequest extends Omit<UserRequest, 'projectIds' | 'loginEnabled'> {
  authUserId: string;
}

export interface ContractorRequest {
  name: string;
  email: string;
  phoneNumber: string;
  addressAttributes: Partial<Address>;
  adminsAttributes: Array<Partial<AdminRequest>>;
}

export interface EstimateAttributes extends Omit<Estimate, 'estimateItems'> {
  id: number;
  completionDate: string;
  expirationDate: string;
  estimateItemsAttributes: Array<Partial<EstimateItem>>
}

export interface BidRequest {
  name: string;
  status: BidStatus;
  description: string;
  projectId: number;
  clientId: number;
  addressAttributes: Partial<Address>;
  estimatesAttributes: Array<Partial<EstimateAttributes>>; // ATT!: only create a bid with one estimate initially
  expenseIds: number[],
  materialIds: number[]
}

export interface UpdateBidRequest {
  name: string;
  description: string;
  clientId: number;
  status: BidStatus;
  addressAttributes: Partial<Address>;
  estimatesAttributes: Array<Partial<EstimateAttributes>>;
  estimateItemIdsToDestroy: number[]
  expenseIds: number[],
  materialIds: number[]
}

// Response Types
export interface UserResponse {
  uuid: string;
  id: number;
  address: Address;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  loginEnabled: boolean;
  type: UserType;
  projects: Associated[];
  title: string;
}

export interface AdminResponse extends UserResponse {
  authUserId: string;
}

export interface ContractorResponse {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  uuid: string;
  address: string;
  loginEnabled: boolean;
  laborers: Associated[];
  projects: Associated[];
  admins: Associated[];
  carpenters: Associated[];
  personnel: Associated[];
  subContractors: Associated[];
}

export interface UsersResponse {
  carpenters: UserResponse[];
  laborers: UserResponse[];
  clients: UserResponse[];
  personnel: CustomUserResponse[];
}

export interface PhaseRequest {
  name: string;
  description?: string;
}

export interface PhaseResponse {
  id: number,
  description: string;
  name: string;
}

export interface CustomUserResponse extends UserResponse {
  title: string;
}

export interface Estimate {
  id?: number;
  estimateItems: EstimateItem[];
  expiration_date: string;
  completion_date: string;
}

export const isEstimate = (estimate: Partial<Estimate>): estimate is Estimate => {
  return (estimate as Estimate).expiration_date !== undefined &&
    (estimate as Estimate).completion_date !== undefined;
};

export interface EstimateItem {
  id?: number;
  description: string;
  name: string;
  pricePerUnit: number;
  quantity: number;
  totalCost: number;
  estimatableType: EstimatableType;
  estimatableId: number;
  phase?: PhaseResponse;
  phaseName?: string; // For create and update requests only for creating a phase
  phaseEstimateItemAttributes?: { phaseId: number | undefined }; // only used for create and update
  _destroy?: boolean
}

export interface BidResponse {
  id: number;
  name: string;
  description: string;
  date: string;
  note: string;
  client: Partial<UserResponse>;
  address: Address;
  estimates: Estimate[];
  latestEstimate: Estimate;
  estimatedCost: number;
  project: Partial<ProjectResponse>;
  status: BidStatus;
}

export interface PersonnelGroupResponse {
  id: number
  title: string
}

export interface PersonnelGroupRequest {
  title: string
};

export interface BidPdfUrl {
  url: string;
}

export interface BidEmailMessage {
  message: string
}

export interface BidAnalysis {
  anomalies: BidAnomaly[]
}

interface BidAnomaly {
  estimateItemId: number;
  estimatedPrice: number;
  suggestedPrice: number;
  reason: string;
}

export interface DocumentUrl {
  url: string;
}

export interface Folder {
  id: number;
  name: string;
  type: FolderType;
}

export interface DocumentRequest {
  name: string
  folderId: number;
  description?: string;
  userIds?: number[];
}

export interface DocumentResponse {
  id: number
  name: string;
  description: string;
  path: string;
  folder: Folder;
  presigned_upload_url: DocumentUploadFields;
}

export type DocumentInfoResponse = Omit<DocumentResponse, 'presigned_upload_url'>;

export interface DocumentUploadFields {
  url: string;
  form_data: {
    key: string;
    acl: string;
    success_action_status: string;
    policy: string;
    'x-amz-signature': string;
    'x-amz-date': string;
    'x-amz-credential': string;
    'x-amz-algorithm': string;
  }
}
export interface DocumentUpdateS3KeyRequest {
  key: string;
  mimeType: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  note: string;
  description: string;
  folderId: number;
  laborers: UserResponse[];
  carpenters: UserResponse[];
  subContractors: Associated[];
  contacts: UserResponse[];
  client: UserResponse;
  addresses: Address[];
  bid: BidResponse;
  completionDate: string;
  estimatedCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectRequest {
  name: string;
  note?: string;
  description?: string;
  clientId: number;
  userIds?: number[];
  subContractorIds?: number[];
  addressesAttributes: Array<Partial<AddressAttributes>>;
  completionDate?: string;
  estimatedCost?: string;
}
