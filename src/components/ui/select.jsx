import React from 'react';
export function Select({ children }) { return <div className='select'>{children}</div>; }
export function SelectTrigger({ children, className='' }) { return <div className={'select-trigger '+className}>{children}</div>; }
export function SelectValue({ placeholder }) { return <div className='select-value'>{placeholder}</div>; }
export function SelectContent({ children }) { return <div className='select-content'>{children}</div>; }
export function SelectItem({ children }) { return <div className='select-item'>{children}</div>; }
export default Select;
