import {
  AFRICANORIGINSPAGE,
  ENSALVEDPAGE,
  ENSALVERSPAGE,
  TRANSATLANTICENSLAVERS,
} from '@/share/CONST_DATA';

export const checkPathPeople = (title: string) => {
  let url = '';
  if (
    title === 'Enslaved' ||
    title === 'Esclavizados' ||
    title === 'Escravizados' ||
    title === 'Enslaved People' ||
    title === 'Personas Esclavizadas' ||
    title === 'Pessoas Escravizadas'
  ) {
    url = `${ENSALVEDPAGE}${AFRICANORIGINSPAGE}#people`;
  } else if (
    title === 'Slave Traders' ||
    title === 'Traficantes de Esclavos' ||
    title === 'Traficantes de Escravos'
  ) {
    url = `${ENSALVERSPAGE}${TRANSATLANTICENSLAVERS}#people`;
  }
  return url;
};
