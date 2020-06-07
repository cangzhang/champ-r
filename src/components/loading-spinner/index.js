import s from './style.module.scss';

import React from 'react';
import cn from 'classnames';
import { Loader } from 'react-feather';

export default function LoadingSpinner({ className, size = 36 }) {
  return <Loader size={size} color={`#1E54B7`} className={cn(s.loading, className)} />;
}
