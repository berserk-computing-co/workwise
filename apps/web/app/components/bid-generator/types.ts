export interface UploadedFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}

export interface FlowState {
  step: 1 | 2 | 3 | 4 | 5;
  address: string;
  formattedAddress: string;
  zipCode: string;
  description: string;
  category: string | null;
  clientName: string;
  files: UploadedFile[];
  projectId: string | null;
}

export type FlowAction =
  | {
      type: 'SET_ADDRESS';
      payload: { address: string; formattedAddress: string; zipCode: string };
    }
  | {
      type: 'SET_DESCRIPTION';
      payload: { description: string; category: string | null };
    }
  | { type: 'SET_PROJECT_ID'; payload: { projectId: string } }
  | { type: 'SET_FILES'; payload: { files: UploadedFile[] } }
  | { type: 'SKIP_FILES' }
  | { type: 'SET_CLIENT'; payload: { clientName: string } }
  | { type: 'SKIP_CLIENT' }
  | { type: 'GO_BACK' };

export const initialState: FlowState = {
  step: 1,
  address: '',
  formattedAddress: '',
  zipCode: '',
  description: '',
  category: null,
  clientName: '',
  files: [],
  projectId: null,
};

export function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'SET_ADDRESS':
      return {
        ...state,
        ...action.payload,
        step: 2,
      };
    case 'SET_DESCRIPTION':
      return {
        ...state,
        description: action.payload.description,
        category: action.payload.category,
        step: 3,
      };
    case 'SET_PROJECT_ID':
      return {
        ...state,
        projectId: action.payload.projectId,
      };
    case 'SET_FILES':
      return {
        ...state,
        files: action.payload.files,
        step: 4,
      };
    case 'SKIP_FILES':
      return {
        ...state,
        step: 4,
      };
    case 'SET_CLIENT':
      return {
        ...state,
        clientName: action.payload.clientName,
        step: 5,
      };
    case 'SKIP_CLIENT':
      return {
        ...state,
        clientName: '',
        step: 5,
      };
    case 'GO_BACK':
      return {
        ...state,
        step: Math.max(1, state.step - 1) as 1 | 2 | 3 | 4 | 5,
      };
    default:
      return state;
  }
}

export const CATEGORIES = [
  'Plumbing',
  'Electrical',
  'Kitchen',
  'Bathroom',
  'Roofing',
  'General Renovation',
  'Painting',
  'Flooring',
  'HVAC',
  'Landscaping',
];
