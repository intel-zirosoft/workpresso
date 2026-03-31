export type BridgeEventType =
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
  | 'ERROR';

export type BridgeMessage<TPayload = unknown> = {
  type: BridgeEventType;
  payload?: TPayload;
};
