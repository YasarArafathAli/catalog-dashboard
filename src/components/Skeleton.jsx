import React from 'react';
import { Skeleton } from 'antd';

const SkeletonPlaceHolder = () => {
  return (
    <>
      <Skeleton avatar paragraph={{ rows: 4 }} />;
      <Skeleton avatar paragraph={{ rows: 4 }} />
      <Skeleton avatar paragraph={{ rows: 4 }} />
    </>
  );
};

export default SkeletonPlaceHolder;
