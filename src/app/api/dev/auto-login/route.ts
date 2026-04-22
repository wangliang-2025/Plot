import { NextResponse } from 'next/server';

/**
 * 仅开发环境使用的自动登录凭据 API
 *
 * 用途：本地启动时浏览器自动用 admin 账号登录，免去每次手敲密码
 * 客户端流程：<DevAutoLogin /> 组件看到 ?autologin=1 → fetch 此接口拿凭据
 *           → 调用 next-auth signIn('credentials', ...) 完成登录
 *
 * 安全双保险：
 *   1. 任何非开发环境一律返回 403（即使 .env 里写了凭据也不会泄漏）
 *   2. 凭据只通过同源 fetch 返回，不出现在 URL / 浏览器历史里
 *   3. 用户可以通过设置 DEV_AUTOLOGIN=0 显式关闭
 */
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Auto-login is only available in development mode.' },
      { status: 403 }
    );
  }
  if (process.env.DEV_AUTOLOGIN === '0') {
    return NextResponse.json(
      { error: 'DEV_AUTOLOGIN explicitly disabled in .env' },
      { status: 403 }
    );
  }

  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    return NextResponse.json(
      { error: 'ADMIN_EMAIL / ADMIN_PASSWORD not set in .env' },
      { status: 500 }
    );
  }

  // Cache-Control: 让浏览器永不缓存这个响应
  return NextResponse.json(
    { email, password },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
