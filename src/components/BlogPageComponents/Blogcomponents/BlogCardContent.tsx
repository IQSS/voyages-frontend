import ReactHtmlParser from 'html-react-parser';
import { RootState } from '@/redux/store';
import { BlogDataProps } from '@/share/InterfaceTypesBlog';
import { useSelector } from 'react-redux';

const BlogCardContent = () => {
  const post = useSelector(
    (state: RootState) => state.getBlogData.post as BlogDataProps
  );
  const content = post?.content;

  return (
    <div className="card-content-body">
      {content ? ReactHtmlParser(content) : null}
    </div>
  );
};
export default BlogCardContent;
