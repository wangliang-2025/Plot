import * as React from 'react';

/**
 * Gitee logo（简化品牌图标）
 * lucide-react 没有 Gitee 图标，所以这里手画
 * 用 currentColor 让外层可以控制颜色；传 brand 走 Gitee 红
 */
export function GiteeIcon({
  className,
  brand = false,
  size = 24,
  ...props
}: React.SVGProps<SVGSVGElement> & { brand?: boolean; size?: number | string }) {
  const fill = brand ? '#C71D23' : 'currentColor';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Gitee"
      {...props}
    >
      <circle cx="12" cy="12" r="11" fill={fill} />
      <path
        fill="#fff"
        d="M16.86 8.16H10.4a2.24 2.24 0 0 0-2.24 2.24v3.2c0 .35.29.64.64.64h3.2c.35 0 .64-.29.64-.64v-.96h-2.24a.64.64 0 0 1-.64-.64v-.32c0-.35.29-.64.64-.64h4.8c.35 0 .64.29.64.64v1.92a3.2 3.2 0 0 1-3.2 3.2H7.2a.64.64 0 0 1-.64-.64v-5.76A4.16 4.16 0 0 1 10.72 6.4h6.14c.35 0 .64.29.64.64v.48c0 .35-.29.64-.64.64Z"
      />
    </svg>
  );
}
