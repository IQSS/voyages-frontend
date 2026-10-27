import { BLOGTYPE, ENSALVEDTYPE, ENSLAVERSTYPE } from '@/share/CONST_DATA';

export const formatType = (type: string) => {
  if (type === ENSALVEDTYPE) {
    return `${ENSALVEDTYPE} people`;
  } else if (type === ENSLAVERSTYPE) {
    return 'slave traders';
  } else if (type === BLOGTYPE) {
    return `${BLOGTYPE} posts`;
  }
  return type;
};
