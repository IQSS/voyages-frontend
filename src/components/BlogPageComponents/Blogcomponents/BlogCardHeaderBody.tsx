import { useEffect, useMemo, useState } from 'react';

import {
  faWhatsapp,
  faSquareFacebook,
  faTwitterSquare,
  faLinkedin,
} from '@fortawesome/free-brands-svg-icons';
import { faSquareEnvelope } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';

import defaultImage from '@/assets/voyage-blog.png';
import NoDataState from '@/components/NoResultComponents/NoDataState';
import { fetchBlogData } from '@/fetch/blogFetch/fetchBlogData';
import { setBlogPost } from '@/redux/getBlogDataSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { BASEURL } from '@/share/AUTH_BASEURL';
import { BLOGPAGE } from '@/share/CONST_DATA';
import {
  BlogDataPropsRequest,
  BlogFilter,
  InitialStateBlog,
  InitialStateBlogProps,
} from '@/share/InterfaceTypesBlog';
import {
  currentBlogCanonicalUrl,
  selectBlogPostResult,
} from '@/utils/functions/blogPostDetail';

const BlogCardHeaderBody = () => {
  const { ID } = useParams();
  const dispatch: AppDispatch = useDispatch();

  const { post } = useSelector(
    (state: RootState) => state.getBlogData as InitialStateBlogProps,
  );

  const { title, thumbnail, authors, subtitle, tags, updated_on } =
    post || InitialStateBlog.post;
  const [postMissing, setPostMissing] = useState(false);
  const [loadingPost, setLoadingPost] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDataBlog = async () => {
      setLoadingPost(true);
      setPostMissing(false);
      dispatch(setBlogPost({ ...InitialStateBlog.post }));

      const filters: BlogFilter[] = [];
      const parsedId = Number.parseInt(ID || '', 10);
      if (!Number.isNaN(parsedId)) {
        filters.push({
          varName: 'id',
          searchTerm: [parsedId],
          op: 'in',
        });
      }

      if (filters.length === 0) {
        setPostMissing(true);
        setLoadingPost(false);
        return;
      }

      const dataSend: BlogDataPropsRequest = {
        filter: filters,
      };

      try {
        const response = await dispatch(fetchBlogData(dataSend)).unwrap();
        if (!isMounted) {
          return;
        }
        const fetchedPost = selectBlogPostResult(response);
        if (fetchedPost) {
          dispatch(setBlogPost(fetchedPost));
        } else {
          setPostMissing(true);
        }
      } catch (error) {
        console.log('error', error);
        if (isMounted) {
          setPostMissing(true);
        }
      } finally {
        if (isMounted) {
          setLoadingPost(false);
        }
      }
    };

    fetchDataBlog();

    return () => {
      isMounted = false;
    };
  }, [dispatch, ID]);

  const formattedDateTime = useMemo(() => {
    if (!updated_on) {
      return '';
    }
    const dateObj = new Date(updated_on);
    if (Number.isNaN(dateObj.getTime())) {
      return '';
    }
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    });
    return `${formattedDate}, ${formattedTime}`;
  }, [updated_on]);

  const canonicalUrl = useMemo(() => currentBlogCanonicalUrl(), [ID]);
  const shareUrl = canonicalUrl || '#';

  if (postMissing) {
    return (
      <div className="card-body">
        <NoDataState text="Blog Post" />
      </div>
    );
  }

  return (
    <div className="card-body" aria-busy={loadingPost}>
      <img
        className="blog-detail-thumbnail"
        src={thumbnail ? `${BASEURL}${thumbnail}` : defaultImage}
        alt={title ? title : ''}
      />
      <h1 className="titleText">{title ? title : ''}</h1>
      <h3 className="subtitle">{subtitle ? subtitle : ''}</h3>
      {formattedDateTime && (
        <p className="card-text text-muted">{formattedDateTime}</p>
      )}
      {authors?.length > 0 &&
        authors?.map((author, index) => {
          return (
            <div className="media" key={`${author.id}-${index}`}>
              <div
                className="media-left media-top"
                key={`${index}-${
                  author.photo || author.institution?.image || 'avatar'
                }`}
              >
                {author.photo ? (
                  <img
                    className="rounded-circle"
                    src={`${BASEURL}${author.photo}`}
                    width="40"
                    height="40"
                    alt={author.name}
                  />
                ) : (
                  <div className="avatar">
                    <i className="fas fa-user fa-3x" aria-hidden="true"></i>
                  </div>
                )}
              </div>
              <div className="media-body" key={`${index}-${author.name}`}>
                <h4 className="media-heading">{author.name}</h4>
                {author?.institution?.name}
              </div>
            </div>
          );
        })}
      <div className="tags-name-blog">
        {tags?.length > 0 &&
          tags?.map((tag, index) => (
            <div key={`${index}-${tag.slug}`} className="tags-name-list">
              <Link to={`/${BLOGPAGE}/tag/${tag.slug}`}>
                <div className="badge badge-secondary">{tag.name}</div>
              </Link>
            </div>
          ))}
      </div>

      <div className="social">
        <a
          href={shareUrl}
          id="share-wa"
          data-sharer="whatsapp"
          className="icon-share"
          data-url={shareUrl}
        >
          <FontAwesomeIcon icon={faWhatsapp} size="lg" />
        </a>
        <a
          href={shareUrl}
          id="share-fb"
          data-sharer="facebook"
          className="icon-share"
          data-url={shareUrl}
        >
          <FontAwesomeIcon icon={faSquareFacebook} size="lg" />
        </a>
        <a
          href={shareUrl}
          id="share-tw"
          className="icon-share"
          data-sharer="twitter"
          data-url={shareUrl}
        >
          <FontAwesomeIcon icon={faTwitterSquare} size="lg" />
        </a>
        <a
          href={shareUrl}
          id="share-li"
          data-sharer="linkedin"
          className="icon-share"
          data-url={shareUrl}
        >
          <FontAwesomeIcon icon={faLinkedin} size="lg" />
        </a>
        <a
          href={shareUrl}
          id="share-em"
          data-sharer="email"
          className="icon-share"
          data-url={shareUrl}
        >
          <FontAwesomeIcon icon={faSquareEnvelope} size="lg" />
        </a>
      </div>
    </div>
  );
};
export default BlogCardHeaderBody;
