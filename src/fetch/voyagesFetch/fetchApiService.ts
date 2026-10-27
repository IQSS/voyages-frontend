import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AUTHTOKEN, BASEURL } from '../../share/AUTH_BASEURL';
import { Options } from '@vitejs/plugin-react-refresh';

export const voyagesApi = createApi({
  reducerPath: 'voyagesApi',
  baseQuery: fetchBaseQuery({ baseUrl: BASEURL }),
  endpoints: (builder) => ({
    getOptions: builder.query({
      query: () => ({
        url: '/common/schemas/?schema_name=Voyage&hierarchical=False/',
        method: 'GET',
        headers: { Authorization: AUTHTOKEN },
      }),
      transformResponse: (response: Options) => {
        return response;
      },
    }),
  }),
});

export const { useGetOptionsQuery } = voyagesApi;
