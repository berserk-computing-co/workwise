import type { ImagePickerResponse } from 'react-native-image-picker';
import type { DocumentResult } from 'expo-document-picker';

export type FileResponseType = ImagePickerResponse | DocumentResult | undefined;
export interface DocumentPickerSuccessResult {
  type: 'success';
  name: string;
  size?: number | undefined;
  uri: string;
  mimeType?: string | undefined;
  lastModified?: number | undefined;
  file?: File | undefined;
  output?: FileList | null | undefined
}

export const isImageFileResponse = (fileResponse: FileResponseType): fileResponse is ImagePickerResponse => {
  return fileResponse !== undefined && Object.keys(fileResponse).some((key) => {
    return ['didCancel', 'assets'].includes(key);
  });
};

export const isDocumentPickerResult = (fileResponse: FileResponseType): fileResponse is DocumentResult => {
  return fileResponse !== undefined && (fileResponse as DocumentResult).type !== undefined;
};

export const isDocumentPickerSuccessResult = (fileResponse: FileResponseType): fileResponse is DocumentResult & DocumentPickerSuccessResult => {
  return isDocumentPickerResult(fileResponse) && fileResponse.type === 'success';
};

export const isDocumentPickerCancelResult = (fileResponse: FileResponseType): fileResponse is DocumentResult & { type: 'cancel' } => {
  return isDocumentPickerResult(fileResponse) && fileResponse.type === 'cancel';
};

export const getNameIfPresent = (fileResponse: FileResponseType): string | undefined => {
  let name;
  if (isDocumentPickerSuccessResult(fileResponse)) {
    name = fileResponse.name;
  }
  return name;
};
