import { LaunchStatusType } from './LaunchTypes.js';

export function isLaunchable(status: LaunchStatusType): boolean {
  return [
    'Available',
    'Local Preview',
    'External URL',
    'Requires Build'
  ].includes(status);
}

export function getStatusLabel(status: LaunchStatusType): string {
  switch (status) {
    case 'Available':
      return 'Ready for Launch';
    case 'Local Preview':
      return 'Local Preview Mode';
    case 'External URL':
      return 'External Resource';
    case 'Requires Build':
      return 'Compilation Required';
    case 'Requires Configuration':
      return 'Setup Required';
    case 'Offline':
      return 'Service Offline';
    case 'Not Available':
    default:
      return 'Unavailable';
  }
}
