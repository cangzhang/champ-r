import s from './style.module.scss';

import React from 'react';
import cn from 'classnames';
import { Loader } from 'react-feather';

interface IProps {
  className: string;
  size: number;
  color: string;
}

// colors: #1E54B7, #3D68EC
export default function LoadingSpinner({ className, size = 36, color = `#3D68EC` }: IProps) {
  return <Loader size={size} color={color} className={cn(s.loading, className)} />;
}
