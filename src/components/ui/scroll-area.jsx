import React from 'react';
export function ScrollArea({ children, className='' }) {
  return <div style={{overflow:'auto'}} className={className}>{children}</div>;
}
export default ScrollArea;
