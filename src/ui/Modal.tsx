import { Modal as RNModal, type ModalProps } from 'react-native';

const ALL_ORIENTATIONS: NonNullable<ModalProps['supportedOrientations']> = [
  'portrait', 'portrait-upside-down', 'landscape', 'landscape-left', 'landscape-right',
];

/**
 * App Modal. React Native's Modal defaults to portrait-only; presenting it in
 * this landscape app raises a red box in dev and crashes release builds.
 * Always import Modal from here, never from 'react-native'.
 */
export function Modal(props: ModalProps) {
  return <RNModal supportedOrientations={ALL_ORIENTATIONS} {...props} />;
}
