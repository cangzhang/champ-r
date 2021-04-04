declare module "*.module.css" {
  const classNames: {
    [key: string]: string;
  }
  export default classNames;
};

declare module "*.module.scss" {
  const classNames: {
    [key: string]: string;
  }
  export default classNames;
};

declare module "*.webp";

declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  const svgUrl: string;
  export default svgUrl;
}
