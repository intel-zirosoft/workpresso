export type BridgeEventType =
  | 'BRIDGE_READY'
  | 'WEB_ROUTE_CHANGED'
  | 'WEB_ROUTE_SNAPSHOT'
  | 'WEB_RUNTIME_ERROR'
  | 'WEB_SESSION_STATUS'
  | 'OPEN_NATIVE_RECORDER'
  | 'PICK_FILE'
  | 'OPEN_SHARE_SHEET'
  | 'OPEN_EXTERNAL_URL'
  | 'REQUEST_PUSH_PERMISSION'
  | 'GET_DEVICE_INFO'
  | 'HAPTIC_FEEDBACK'
  | 'RECORDER_RESULT'
  | 'FILE_PICK_RESULT'
  | 'SHARE_COMPLETED'
  | 'PUSH_TOKEN_READY'
  | 'DEVICE_INFO_RESULT'
  | 'EXTERNAL_URL_RESULT'
  | 'ERROR';

export type BridgeMessage<TPayload = unknown> = {
  type: BridgeEventType;
  payload?: TPayload;
};

export type WebSessionStatusPayload = {
  kind: 'API_UNAUTHORIZED' | 'LOGIN_PAGE';
  status?: number;
  url?: string;
};
