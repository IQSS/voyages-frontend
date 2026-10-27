/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useEffect, useRef, useState } from 'react';

import { Autocomplete, Stack, TextField, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useAutoBlogList } from '@/hooks/useAutoBlogList';
import { useDebounce } from '@/hooks/useDebounce';
import { usePageRouter } from '@/hooks/usePageRouter';
import { setBlogAutoLists, setSearchAutoValue } from '@/redux/getBlogDataSlice';
import { resetAll } from '@/redux/resetAllSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { BLOGPAGE } from '@/share/CONST_DATA';
import { Filter, IRootFilterObject } from '@/share/InterfaceTypes';
import { ResultAutoList } from '@/share/InterfaceTypesBlog';
import { formatTextURL } from '@/utils/functions/formatText';
import {
  blogTagNameFromRouteSlug,
  blogTagSlugFromName,
} from '@/utils/functions/blogRoutes';

import SelectBlogDropdown from '../../SelectorComponents/SelectDrowdown/SelectBlogDropdown';

const AutoCompletedSearhBlog = () => {
  const { tagID } = useParams();
  const autocompleteRef = useRef(null);
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { searchTitle, searchAutoKey, searchAutoValue, blogAutoLists } =
    useSelector((state: RootState) => state.getBlogData);
  const { languageValue } = useSelector(
    (state: RootState) => state.getLanguages,
  );

  const { currentBlockName, blogURL } = usePageRouter();

  const [inputValue, setInputValue] = useState<
    ResultAutoList | undefined | null
  >(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFetchHashLoad, setFetchHashLoad] = useState(true);
  const [listData, setListData] = useState<ResultAutoList[]>([]);

  // Local state for immediate input changes
  const [localSearchValue, setLocalSearchValue] = useState<string>('');

  // Use the debounce hook with 200ms delay
  const debouncedSearchValue = useDebounce(localSearchValue, 200);

  // Initialize local search value only once
  useEffect(() => {
    if (searchAutoValue && localSearchValue === '') {
      setLocalSearchValue(searchAutoValue.trim());
    } else if (blogURL && localSearchValue === '' && !searchAutoValue) {
      const reversedValue = blogTagNameFromRouteSlug(blogURL);

      if (reversedValue) {
        setLocalSearchValue(reversedValue);
      }
    }
  }, [searchAutoValue, blogURL]);

  const limit = 10;
  const offset = 0;

  const filters: Filter[] = [
    {
      op: 'exact',
      varName: 'language',
      searchTerm: languageValue,
    },
  ];

  const dataSend: IRootFilterObject = {
    varName: searchAutoKey,
    querystr: debouncedSearchValue,
    offset: offset,
    limit: limit,
    filter: filters,
  };

  const { data, isLoading, isError } = useAutoBlogList(dataSend);

  // Effect to dispatch the debounced value to Redux (only when it changes)
  useEffect(() => {
    if (debouncedSearchValue !== searchAutoValue) {
      dispatch(setSearchAutoValue(debouncedSearchValue));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchValue, dispatch]);

  // Handle API data response
  useEffect(() => {
    if (!isLoading && !isError && data) {
      const { suggested_values } = data;
      dispatch(setBlogAutoLists(suggested_values));
      if (isFetchHashLoad) {
        setListData(suggested_values);
      }
    }

    // Cleanup function - only run on unmount
    return () => {
      if (!data) {
        // Only cleanup if there's no data
        dispatch(setBlogAutoLists([]));
      }
    };
  }, [data, isLoading, isError, dispatch, isFetchHashLoad]);

  // Handle initial load with tagID
  useEffect(() => {
    if (isInitialLoad && tagID && blogAutoLists.length > 0) {
      const tagLabel = blogAutoLists.find(
        (item: any) => item.id === Number(tagID),
      );
      if (tagLabel) {
        setInputValue(tagLabel);
      }
      setIsInitialLoad(false);
    }
  }, [tagID, blogAutoLists, isInitialLoad]);

  // Handle hash load
  useEffect(() => {
    if (isFetchHashLoad && currentBlockName && listData.length > 0) {
      const tagLabel = listData.find((item) => {
        return blogTagSlugFromName(item.value) === currentBlockName;
      });

      if (tagLabel) {
        setInputValue(tagLabel);
        setFetchHashLoad(false);
      }
    }
  }, [currentBlockName, isFetchHashLoad, listData]);

  const handleInputChange = useCallback(
    (event: React.SyntheticEvent<Element, Event>, value: string) => {
      setLocalSearchValue(value);
    },
    [],
  );

  const handleAutocompleteChange = useCallback(
    (event: React.SyntheticEvent, newValue: ResultAutoList | null) => {
      setInputValue(newValue || null);
      if (tagID) {
        navigate(`/${BLOGPAGE}`);
      }
      if (newValue) {
        if (newValue.value === 'Introductory Maps') {
          navigate(
            `/${BLOGPAGE}/tag/${formatTextURL('all Intro Maps')}#${formatTextURL('all Intro Maps')}`,
          );
        } else {
          navigate(
            `/${BLOGPAGE}/tag/${formatTextURL(newValue.value)}#${formatTextURL(newValue.value)}`,
          );
        }
      }
    },
    [tagID, navigate],
  );

  const handleReset = useCallback(() => {
    setListData([]);
    setInputValue(null);
    setLocalSearchValue('');
    dispatch(resetAll());
    dispatch(setSearchAutoValue(''));
  }, [dispatch]);

  return (
    <>
      <SelectBlogDropdown handleReset={handleReset} />
      <Stack spacing={1} className="autocomplete-blog-search">
        <Autocomplete
          ref={autocompleteRef}
          multiple={false}
          id="tags-outlined"
          options={blogAutoLists}
          getOptionLabel={(option) => option.value || '--'}
          onInputChange={handleInputChange}
          value={inputValue}
          onChange={handleAutocompleteChange}
          inputValue={localSearchValue}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label={
                <Typography
                  variant="body1"
                  style={{
                    fontSize: 16,
                  }}
                  color="#ffffff"
                >
                  Search by {searchTitle}
                </Typography>
              }
              slotProps={{
                inputLabel: { style: { textAlign: 'center' } },
                input: {
                  ...params.InputProps,
                  className: 'input-blog-autosearch',
                },
              }}
              placeholder={searchTitle}
              style={{ padding: 8 }}
            />
          )}
        />
      </Stack>
    </>
  );
};

export default AutoCompletedSearhBlog;
