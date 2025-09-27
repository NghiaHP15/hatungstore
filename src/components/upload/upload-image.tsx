import { GetProp, Upload } from 'antd';
import { UploadChangeParam, UploadFile, UploadProps } from 'antd/es/upload';
import { useEffect, useState } from 'react';

import { CloudUploadOutlined, LoadingOutlined } from '@ant-design/icons';
import { beforeAvatarUpload, getBlobUrl } from './utils';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];

interface Props extends UploadProps {
  defaultImage?: string;
  loading?: boolean;
  width?: string;
  height?: string;
  helperText?: React.ReactElement | string;
}
export function UploadImage({ helperText, defaultImage, width= "150px", height= "150px", loading = false,...other }: Props) {
  const [imageUrl, setImageUrl] = useState<string>(defaultImage || '');

  useEffect(() => {
    if(defaultImage)
    setImageUrl(defaultImage);
  },[defaultImage])

  const [isHover, setIsHover] = useState(false);
  const handelHover = (hover: boolean) => {
    setIsHover(hover);
  };

  const handleChange: UploadProps['onChange'] = (info: UploadChangeParam<UploadFile>) => {
    if (info.file.status === 'uploading') {
      return;
    }
    if (['done', 'error'].includes(info.file.status!)) {
      // TODO: Get this url from response in real world.
      setImageUrl(getBlobUrl(info.file.originFileObj!));
    }
  };

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };
  

  // eslint-disable-next-line @next/next/no-img-element
  const renderPreview = <img src={imageUrl} alt="" className="absolute rounded-md h-full w-auto" />;

  const renderPlaceholder = (
    <div
      style={{
        backgroundColor: !imageUrl || isHover ? 'rgba(22, 28, 36, 0.15)' : 'transparent',
        color: '#fff',
      }}
      className="absolute z-10 flex h-full w-full flex-col items-center justify-center"
    >
      <CloudUploadOutlined className='text-3xl font-bold' />
      <div className="mt-1 text-xs">Upload Photo</div>
    </div>
  );

  const renderLoading = (
    <div
      style={{
        backgroundColor: !imageUrl || isHover ? 'rgba(22, 28, 36, 0.15)' : 'transparent',
        color: '#fff',
      }}
      className="absolute z-10 flex h-full w-full flex-col items-center justify-center"
    >
      <LoadingOutlined className='text-3xl font-bold' />
    </div>
  )

  const renderContent = (
      <div
        className="relative p-2 inset-0 flex h-full w-full items-center rounded-md"
      >
        <div
          className='relative inset-0 flex h-full w-full items-center justify-center overflow-hidden rounded-md'
          onMouseEnter={() => handelHover(true)}
          onMouseLeave={() => handelHover(false)}
        >
          {loading ? renderLoading : null}
          {imageUrl ? renderPreview : null}
          {!loading && (!imageUrl || isHover) ? renderPlaceholder : null}
        </div>
      </div>
  );

  return (
    <Upload
      name="image"
      showUploadList={false}
      listType="picture-card"
      className="logo-uploader "
      {...other}
      beforeUpload={beforeAvatarUpload}
      onChange={handleChange}
      onPreview={onPreview}
    >
      {renderContent}
    </Upload>
  );
}
