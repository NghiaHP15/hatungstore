import { Select } from 'antd';
import React from 'react';

const { Option } = Select;

interface PageSizeOptionProps {
  pageSize: number;
  onChange: (value: number) => void; 
}

const PageSizeOption: React.FC<PageSizeOptionProps> = ({ pageSize, onChange }) => {
  return (
    <div className='flex items-center gap-1'>
      {/* <span>Show</span> */}
      <Select
        defaultValue={pageSize}
        style={{ width: 80, margin: '0 8px' }}
        onChange={(value) => onChange(Number(value))}
      >
        <Option value={10}>10</Option>
        <Option value={20}>20</Option>
        <Option value={30}>30</Option>
        <Option value={50}>50</Option>
      </Select>
    </div>
  );
};

export default PageSizeOption;
